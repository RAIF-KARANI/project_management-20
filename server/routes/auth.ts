import { Request, Response, Router } from "express";
import { db, findUser } from "./store";
import jwt from "jsonwebtoken";
import * as pg from "../db/client";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const TOKEN_EXPIRY = "7d";

export function registerAuthRoutes(app: any) {
  const router = Router();

  router.post("/login", async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ error: "email required" });
    try {
      let user = null;
      if (pg.enabled) {
        user = await pg.getUserByEmail(email);
      } else {
        user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      }
      if (!user) return res.status(401).json({ error: "invalid credentials" });

      const token = jwt.sign(
        { sub: user.id, role: user.role, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY },
      );

      res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "login failed" });
    }
  });

  router.get("/me", async (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "missing authorization" });
    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ error: "invalid authorization format" });
    const token = parts[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      let user = null;
      if (pg.enabled) {
        user = await pg.getUserById(payload.sub);
      } else {
        user = findUser(payload.sub);
      }
      if (!user) return res.status(404).json({ error: "user not found" });
      res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(401).json({ error: "invalid token" });
    }
  });

  app.use("/api/auth", router);
}
