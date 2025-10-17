import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "DEVELOPER"]),
});
export const updateUserSchema = createUserSchema.partial();

export const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  deadline: z.string().datetime().nullable().optional(),
});
export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});
export const updateTaskSchema = createTaskSchema.partial();
