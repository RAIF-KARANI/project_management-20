/**
 * Shared types and small pure functions used by both client & server
 */

export type Role = "ADMIN" | "MANAGER" | "DEVELOPER";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string; // ISO date
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  memberIds: string[]; // User IDs
  deadline?: string | null; // ISO date
  createdAt: string; // ISO date
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string; // ISO date
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string | null;
  status: TaskStatus;
  dueDate?: string | null; // ISO date
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskCounts {
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface MetricsResponse {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: TaskCounts;
  overdueByProject: Record<string, number>; // projectId -> overdue count
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  memberIds?: string[];
  deadline?: string | null;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: Role;
}

export interface UpdateUserInput extends Partial<CreateUserInput> {}

// Utility to compute completion percentage
export function computeCompletionPercent(tasks: Task[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === "DONE").length;
  return Math.round((done / tasks.length) * 100);
}
