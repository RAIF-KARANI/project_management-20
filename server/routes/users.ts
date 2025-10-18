import { Request, Response, Router } from "express";
import { db, userPasswords } from "./store";
import { randomUUID } from "node:crypto";
import { createUserSchema, updateUserSchema } from "./validation";
import { User } from "@shared/api";
import * as pg from "../db/client";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

export function registerUserRoutes(app: any) {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    try {
      if (pg.enabled) {
        const users = await pg.getAllUsers();
        return res.json(users);
      }
      return res.json(db.users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to list users" });
    }
  });

  // create user - admin only
  router.post(
    "/",
    requireAuth,
    requireRole("ADMIN"),
    async (req: Request, res: Response) => {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.flatten());
      try {
        if (pg.enabled) {
          const created = await pg.createUser({
            name: parsed.data.name,
            email: parsed.data.email,
            role: parsed.data.role,
            password: parsed.data.password ?? undefined,
          });
          return res.status(201).json(created);
        }
        const now = new Date().toISOString();
        const user: User = { id: randomUUID(), createdAt: now, name: parsed.data.name, email: parsed.data.email, role: parsed.data.role };
        db.users.push(user);
        // store password in in-memory map
        if (parsed.data.password) {
          const { hashPassword } = await import('../utils/password');
          userPasswords[user.email] = hashPassword(parsed.data.password);
        }
        res.status(201).json(user);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "failed to create user" });
      }
    },
  );

  router.get("/:id", async (req: Request, res: Response) => {
    try {
      if (pg.enabled) {
        const user = await pg.getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json(user);
      }
      const user = db.users.find((u) => u.id === req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to get user" });
    }
  });

  // update user - admin only
  router.patch(
    "/:id",
    requireAuth,
    requireRole("ADMIN"),
    async (req: Request, res: Response) => {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.flatten());
      try {
        if (pg.enabled) {
          // if password provided, handle in pg client
          const patch = { ...parsed.data } as any;
          if (patch.password) {
            // update other fields via updateUser
            const updated = await pg.updateUser(req.params.id, { name: patch.name, email: patch.email, role: patch.role });
            await pg.updateUserPassword(req.params.id, patch.password).catch(() => {});
            if (!updated) return res.status(404).json({ error: 'User not found' });
            return res.json(updated);
          }
          const updated = await pg.updateUser(req.params.id, parsed.data);
          if (!updated)
            return res.status(404).json({ error: "User not found" });
          return res.json(updated);
        }
        const i = db.users.findIndex((u) => u.id === req.params.id);
        if (i === -1) return res.status(404).json({ error: "User not found" });
        db.users[i] = { ...db.users[i], ...parsed.data };
        // handle password change for in-memory
        if (parsed.data.password) {
          const { hashPassword } = await import('../utils/password');
          userPasswords[db.users[i].email] = hashPassword(parsed.data.password);
        }
        res.json(db.users[i]);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "failed to update user" });
      }
    },
  );

  // delete user - admin only
  router.delete(
    "/:id",
    requireAuth,
    requireRole("ADMIN"),
    async (req: Request, res: Response) => {
      try {
        if (pg.enabled) {
          const deleted = await pg.deleteUser(req.params.id);
          if (!deleted)
            return res.status(404).json({ error: "User not found" });
          return res.json(deleted);
        }
        const i = db.users.findIndex((u) => u.id === req.params.id);
        if (i === -1) return res.status(404).json({ error: "User not found" });
        const [removed] = db.users.splice(i, 1);
        res.json(removed);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "failed to delete user" });
      }
    },
  );

  app.use("/api/users", router);
}
