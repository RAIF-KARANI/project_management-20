import { Project, Role, Task, TaskStatus, User } from "@shared/api";
import { randomUUID } from "node:crypto";

export type DB = {
  users: User[];
  projects: Project[];
  tasks: Task[];
};

export const db: DB = {
  users: [],
  projects: [],
  tasks: [],
};

// in-memory password map for seeded/demo users: email -> hashed password
export const userPasswords: Record<string, string> = {};

function iso(date: Date) {
  return date.toISOString();
}

export async function seed() {
  if (db.users.length) return; // seed once
  const now = new Date();

  const admin: User = {
    id: randomUUID(),
    name: "Alex Admin",
    email: "alex.admin@example.com",
    role: "ADMIN",
    createdAt: iso(now),
  };
  const manager: User = {
    id: randomUUID(),
    name: "Morgan Manager",
    email: "morgan.manager@example.com",
    role: "MANAGER",
    createdAt: iso(now),
  };
  const dev1: User = {
    id: randomUUID(),
    name: "Devon Dev",
    email: "devon.dev@example.com",
    role: "DEVELOPER",
    createdAt: iso(now),
  };
  const dev2: User = {
    id: randomUUID(),
    name: "Riley Dev",
    email: "riley.dev@example.com",
    role: "DEVELOPER",
    createdAt: iso(now),
  };
  db.users.push(admin, manager, dev1, dev2);
  const { hashPassword } = await import("../utils/password");
  const pwd = hashPassword("password");
  userPasswords[admin.email] = pwd;
  userPasswords[manager.email] = pwd;
  userPasswords[dev1.email] = pwd;
  userPasswords[dev2.email] = pwd;

  const proj: Project = {
    id: randomUUID(),
    name: "Fusion Platform",
    description:
      "Internal tool to manage software projects with tasks, roles and metrics.",
    memberIds: [admin.id, manager.id, dev1.id, dev2.id],
    deadline: iso(new Date(now.getTime() + 14 * 24 * 3600 * 1000)),
    createdAt: iso(now),
  };
  db.projects.push(proj);

  const t1: Task = {
    id: randomUUID(),
    projectId: proj.id,
    title: "Design DB schema",
    description: "Tables for users, projects, tasks, comments",
    assigneeId: manager.id,
    status: "IN_PROGRESS",
    dueDate: iso(new Date(now.getTime() + 3 * 24 * 3600 * 1000)),
    comments: [],
    createdAt: iso(now),
    updatedAt: iso(now),
  };
  const t2: Task = {
    id: randomUUID(),
    projectId: proj.id,
    title: "Implement task API",
    description: "CRUD endpoints with validation",
    assigneeId: dev1.id,
    status: "TODO",
    dueDate: iso(new Date(now.getTime() + 5 * 24 * 3600 * 1000)),
    comments: [],
    createdAt: iso(now),
    updatedAt: iso(now),
  };
  const t3: Task = {
    id: randomUUID(),
    projectId: proj.id,
    title: "Build dashboard UI",
    description: "Metrics, kanban, create flows",
    assigneeId: dev2.id,
    status: "DONE",
    dueDate: iso(new Date(now.getTime() - 1 * 24 * 3600 * 1000)),
    comments: [],
    createdAt: iso(now),
    updatedAt: iso(now),
  };
  db.tasks.push(t1, t2, t3);
}

export function overdue(t: Task): boolean {
  if (!t.dueDate) return false;
  const due = new Date(t.dueDate).getTime();
  return t.status !== "DONE" && due < Date.now();
}

export function findUser(id?: string | null) {
  return db.users.find((u) => u.id === id);
}

export function statusFrom(input?: string): TaskStatus | undefined {
  if (!input) return undefined;
  const map: Record<string, TaskStatus> = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
  };
  return map[input.toUpperCase()];
}
