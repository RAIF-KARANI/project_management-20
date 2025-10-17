import { Request, Response, Router } from "express";
import { db } from "./store";
import { randomUUID } from "node:crypto";
import { createUserSchema, updateUserSchema } from "./validation";
import { User } from "@shared/api";

export function registerUserRoutes(app: any) {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.json(db.users);
  });

  router.post("/", (req: Request, res: Response) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const now = new Date().toISOString();
    const user: User = { id: randomUUID(), createdAt: now, ...parsed.data };
    db.users.push(user);
    res.status(201).json(user);
  });

  router.get("/:id", (req: Request, res: Response) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  router.patch("/:id", (req: Request, res: Response) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const i = db.users.findIndex((u) => u.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "User not found" });
    db.users[i] = { ...db.users[i], ...parsed.data };
    res.json(db.users[i]);
  });

  router.delete("/:id", (req: Request, res: Response) => {
    const i = db.users.findIndex((u) => u.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "User not found" });
    const [removed] = db.users.splice(i, 1);
    res.json(removed);
  });

  app.use("/api/users", router);
}
