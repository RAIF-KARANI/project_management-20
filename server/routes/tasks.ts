import { Request, Response, Router } from "express";
import { db, overdue, statusFrom } from "./store";
import { randomUUID } from "node:crypto";
import { createTaskSchema, updateTaskSchema } from "./validation";
import { Task } from "@shared/api";

export function registerTaskRoutes(app: any) {
  const router = Router();

  router.get("/", (req: Request, res: Response) => {
    const { projectId, assigneeId, status, limit } = req.query as Record<string, string>;
    let tasks = db.tasks.slice();
    if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
    if (assigneeId) tasks = tasks.filter((t) => t.assigneeId === assigneeId);
    if (status) {
      const s = statusFrom(status);
      if (s) tasks = tasks.filter((t) => t.status === s);
    }
    if (limit) tasks = tasks.slice(0, Number(limit));
    res.json(tasks);
  });

  router.post("/", (req: Request, res: Response) => {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      comments: [],
      status: "TODO",
      createdAt: now,
      updatedAt: now,
      ...parsed.data,
    };
    db.tasks.push(task);
    res.status(201).json(task);
  });

  router.get("/:id", (req: Request, res: Response) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  router.patch("/:id", (req: Request, res: Response) => {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const i = db.tasks.findIndex((t) => t.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "Task not found" });
    db.tasks[i] = { ...db.tasks[i], ...parsed.data, updatedAt: new Date().toISOString() };
    res.json(db.tasks[i]);
  });

  router.delete("/:id", (req: Request, res: Response) => {
    const i = db.tasks.findIndex((t) => t.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "Task not found" });
    const [removed] = db.tasks.splice(i, 1);
    res.json(removed);
  });

  router.post("/:id/comments", (req: Request, res: Response) => {
    const { text, userId } = req.body as { text?: string; userId?: string };
    if (!text || !userId) return res.status(400).json({ error: "text and userId are required" });
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const comment = { id: randomUUID(), text, userId, createdAt: new Date().toISOString() };
    task.comments.push(comment);
    task.updatedAt = new Date().toISOString();
    res.status(201).json(comment);
  });

  app.use("/api/tasks", router);
}
