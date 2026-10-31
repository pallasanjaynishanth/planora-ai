import { taskDraftSchema, type TaskDraft, type Task } from "../../schemas/plan";
import { addDays, daysBetween, today } from "../../utils/dates";
export function orderTasks<T extends TaskDraft>(tasks: T[]): T[] {
  const byId = new Map<string, T>();
  for (const task of tasks) {
    taskDraftSchema.parse({
      id: task.id,
      title: task.title,
      daysBefore: task.daysBefore,
      priority: task.priority,
      required: task.required,
      dependencies: task.dependencies,
    });
    if (byId.has(task.id)) throw new Error(`Duplicate task ID: ${task.id}.`);
    byId.set(task.id, task);
  }
  for (const task of tasks) {
    if (new Set(task.dependencies).size !== task.dependencies.length)
      throw new Error(`Repeated dependency for ${task.title}.`);
    for (const dep of task.dependencies) {
      if (dep === task.id)
        throw new Error(`Task ${task.title} cannot depend on itself.`);
      if (!byId.has(dep))
        throw new Error(`Missing dependency ${dep} for ${task.title}.`);
    }
  }
  const result: T[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(task: T) {
    if (visiting.has(task.id))
      throw new Error(`Circular dependency involving ${task.title}.`);
    if (visited.has(task.id)) return;
    visiting.add(task.id);
    for (const id of task.dependencies) {
      const dep = byId.get(id);
      if (dep) visit(dep);
    }
    visiting.delete(task.id);
    visited.add(task.id);
    result.push(task);
  }
  tasks.forEach(visit);
  for (const task of result)
    for (const id of task.dependencies) {
      const dep = byId.get(id);
      if (dep && dep.daysBefore < task.daysBefore)
        throw new Error(
          `Deadline for ${task.title} is earlier than its prerequisite ${dep.title}.`,
        );
    }
  return result;
}
export function taskState(
  task: Task,
  eventDate: string,
  tasks: Task[],
  now = today(),
) {
  const due = addDays(eventDate, -task.daysBefore);
  const blocked = task.dependencies.some(
    (id) => !tasks.find((t) => t.id === id)?.completed,
  );
  return {
    due,
    blocked,
    overdue: !task.completed && due < now,
    approaching:
      !task.completed &&
      daysBetween(now, due) >= 0 &&
      daysBetween(now, due) <= 7,
  };
}
export function setTaskCompletion(
  tasks: Task[],
  id: string,
  completed: boolean,
): Task[] {
  orderTasks(tasks);
  const task = tasks.find((t) => t.id === id);
  if (!task) throw new Error("Task was not found.");
  if (
    completed &&
    task.dependencies.some((dep) => !tasks.find((t) => t.id === dep)?.completed)
  )
    throw new Error("Complete the prerequisite tasks first.");
  if (
    !completed &&
    tasks.some((t) => t.completed && t.dependencies.includes(id))
  )
    throw new Error("Reopen completed dependent tasks first.");
  return tasks.map((t) => (t.id === id ? { ...t, completed } : t));
}
export function changeDependencies(
  tasks: Task[],
  id: string,
  dependencies: string[],
  daysBefore: number,
): Task[] {
  if (!tasks.some((t) => t.id === id)) throw new Error("Task was not found.");
  const next = tasks.map((t) =>
    t.id === id ? { ...t, dependencies, daysBefore } : t,
  );
  orderTasks(next);
  if (
    next.some(
      (t) =>
        t.completed &&
        t.dependencies.some((d) => !next.find((x) => x.id === d)?.completed),
    )
  )
    throw new Error("A completed task cannot have unfinished prerequisites.");
  return next;
}
