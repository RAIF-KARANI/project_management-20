import { Request, Response, Router } from "express";
import { db } from "./store";
import { randomUUID } from "node:crypto";
import { createProjectSchema, updateProjectSchema } from "./validation";
import { Project } from "@shared/api";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

export function registerProjectRoutes(app: any) {
  const router = Router();

  // list projects - public
  router.get("/", (_req: Request, res: Response) => {
    res.json(db.projects);
  });

  // create project - only managers and admins
  router.post(
    "/",
    requireAuth,
    requireRole("ADMIN", "MANAGER"),
    (req: Request, res: Response) => {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.flatten());
      const now = new Date().toISOString();
      const project: Project = {
        id: randomUUID(),
        createdAt: now,
        memberIds: [],
        ...parsed.data,
      };
      if (!project.memberIds) project.memberIds = [];
      db.projects.push(project);
      res.status(201).json(project);
    },
  );

  router.get("/:id", (req: Request, res: Response) => {
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  // update - only managers and admins
  router.patch(
    "/:id",
    requireAuth,
    requireRole("ADMIN", "MANAGER"),
    (req: Request, res: Response) => {
      const parsed = updateProjectSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.flatten());
      const i = db.projects.findIndex((p) => p.id === req.params.id);
      if (i === -1) return res.status(404).json({ error: "Project not found" });
      db.projects[i] = { ...db.projects[i], ...parsed.data };
      res.json(db.projects[i]);
    },
  );

  // delete - only admins
  router.delete(
    "/:id",
    requireAuth,
    requireRole("ADMIN"),
    (req: Request, res: Response) => {
      const i = db.projects.findIndex((p) => p.id === req.params.id);
      if (i === -1) return res.status(404).json({ error: "Project not found" });
      const [removed] = db.projects.splice(i, 1);
      // cascade delete tasks
      db.tasks = db.tasks.filter((t) => t.projectId !== removed.id);
      res.json(removed);
    },
  );

  app.use("/api/projects", router);
}
