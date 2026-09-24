import { Request, Response, Router } from "express";
import { db, overdue, statusFrom } from "./store";
import { randomUUID } from "node:crypto";
import { createTaskSchema, updateTaskSchema } from "./validation";
import { Task } from "@shared/api";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

export function registerTaskRoutes(app: any) {
  const router = Router();

  // list tasks - public (dashboard needs to read tasks without requiring auth)
  router.get("/", (req: Request, res: Response) => {
    const { projectId, assigneeId, status, limit } = req.query as Record<
      string,
      string
    >;
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

  // create - only managers and admins
  router.post(
    "/",
    requireAuth,
    requireRole("ADMIN", "MANAGER"),
    (req: Request, res: Response) => {
      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error.flatten());
      const now = new Date().toISOString();
      const { projectId, title, description, assigneeId, status, dueDate } =
        parsed.data;
      const task: Task = {
        id: randomUUID(),
        projectId,
        title,
        description,
        assigneeId,
        status: status ?? "TODO",
        dueDate,
        comments: [],
        createdAt: now,
        updatedAt: now,
      };
      db.tasks.push(task);
      res.status(201).json(task);
    },
  );

  router.get("/:id", requireAuth, (req: Request, res: Response) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  // update - admins/managers can edit all fields; developers can only change status/comments on assigned tasks
  router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const i = db.tasks.findIndex((t) => t.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: "Task not found" });
    const requester = (req as any).user;

    // Admins and Managers can update anything
    if (requester.role === "ADMIN" || requester.role === "MANAGER") {
      db.tasks[i] = {
        ...db.tasks[i],
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      };
      return res.json(db.tasks[i]);
    }

    // Developers can only update status and add comments, and only on tasks assigned to them
    if (requester.role === "DEVELOPER") {
      const task = db.tasks[i];
      if (task.assigneeId !== requester.id)
        return res.status(403).json({ error: "forbidden" });
      const allowed: Partial<Task> = {};
      if (parsed.data.status)
        allowed.status = parsed.data.status as Task["status"];
      if (parsed.data.description) {
        // push as a comment
        const comment = {
          id: randomUUID(),
          text: parsed.data.description,
          userId: requester.id,
          createdAt: new Date().toISOString(),
        };
        task.comments.push(comment);
      }
      task.status = allowed.status ?? task.status;
      task.updatedAt = new Date().toISOString();
      db.tasks[i] = task;
      return res.json(db.tasks[i]);
    }

    return res.status(403).json({ error: "forbidden" });
  });

  // delete - only admin
  router.delete(
    "/:id",
    requireAuth,
    requireRole("ADMIN"),
    (req: Request, res: Response) => {
      const i = db.tasks.findIndex((t) => t.id === req.params.id);
      if (i === -1) return res.status(404).json({ error: "Task not found" });
      const [removed] = db.tasks.splice(i, 1);
      res.json(removed);
    },
  );

  // comments - authenticated users can post comments; user id comes from token
  router.post("/:id/comments", requireAuth, (req: Request, res: Response) => {
    const { text } = req.body as { text?: string };
    const requester = (req as any).user;
    if (!text) return res.status(400).json({ error: "text is required" });
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const comment = {
      id: randomUUID(),
      text,
      userId: requester.id,
      createdAt: new Date().toISOString(),
    };
    task.comments.push(comment);
    task.updatedAt = new Date().toISOString();
    res.status(201).json(comment);
  });

  app.use("/api/tasks", router);
}
