import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as pg from "../db/client";
import { findUser } from "../routes/store";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

interface JwtPayload {
  sub: string;
  role: string;
  email?: string;
  name?: string;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "missing authorization" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ error: "invalid authorization format" });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    let user = null;
    if (pg.enabled) {
      user = await pg.getUserById(payload.sub);
    } else {
      user = findUser(payload.sub);
    }
    if (!user) return res.status(401).json({ error: "user not found" });
    // attach user to request
    (req as any).user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "invalid token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "unauthenticated" });
    if (!roles.includes(user.role))
      return res.status(403).json({ error: "forbidden" });
    next();
  };
}
