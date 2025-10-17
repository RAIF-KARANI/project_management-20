import { describe, expect, it } from "vitest";
import { computeCompletionPercent, Task } from "./api";

describe("computeCompletionPercent", () => {
  const base: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
    projectId: "p1",
    title: "t",
    description: "",
    assigneeId: null,
    status: "TODO",
    dueDate: null,
    comments: [],
  };

  it("returns 0 with no tasks", () => {
    expect(computeCompletionPercent([])).toBe(0);
  });

  it("computes percent based on DONE count", () => {
    const tasks: Task[] = [
      { id: "1", createdAt: "", updatedAt: "", ...base, status: "DONE" },
      { id: "2", createdAt: "", updatedAt: "", ...base, status: "IN_PROGRESS" },
      { id: "3", createdAt: "", updatedAt: "", ...base, status: "TODO" },
    ];
    expect(computeCompletionPercent(tasks)).toBe(33);
  });
});
