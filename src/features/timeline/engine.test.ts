import { describe, expect, it } from "vitest";
import {
  orderTasks,
  changeDependencies,
  setTaskCompletion,
  taskState,
} from "./engine";
import type { Task } from "../../schemas/plan";
const t = (id: string, dependencies: string[] = [], daysBefore = 10): Task => ({
  id,
  title: id,
  dependencies,
  daysBefore,
  priority: "high",
  required: true,
  completed: false,
});
describe("dependency-aware timeline", () => {
  it("orders prerequisites before dependents", () =>
    expect(
      orderTasks([t("c", ["b"]), t("b", ["a"]), t("a")]).map((x) => x.id),
    ).toEqual(["a", "b", "c"]));
  it("keeps independent tasks in stable input order", () => {
    const tasks = [t("z"), t("b"), t("a")];
    expect(orderTasks(tasks)).toEqual(tasks);
    expect(orderTasks(tasks)).toEqual(orderTasks(tasks));
  });
  it("rejects missing dependencies", () =>
    expect(() => orderTasks([t("b", ["a"])])).toThrow(/Missing/));
  it("rejects self dependencies", () =>
    expect(() => orderTasks([t("a", ["a"])])).toThrow(/itself/));
  it("rejects duplicate IDs", () =>
    expect(() => orderTasks([t("a"), t("a")])).toThrow(/Duplicate/));
  it("rejects duplicate references", () =>
    expect(() => orderTasks([t("a"), t("b", ["a", "a"])])).toThrow(/Repeated/));
  it("rejects cycles", () =>
    expect(() =>
      orderTasks([t("a", ["c"]), t("b", ["a"]), t("c", ["b"])]),
    ).toThrow(/Circular/));
  it("rejects prerequisites scheduled after dependents", () =>
    expect(() => orderTasks([t("a", [], 1), t("b", ["a"], 10)])).toThrow(
      /Deadline/,
    ));
  it("rejects a bad edit without mutating the original", () => {
    const tasks = [t("a"), t("b", ["a"])];
    expect(() => changeDependencies(tasks, "a", ["b"], 10)).toThrow();
    expect(tasks[0]?.dependencies).toEqual([]);
  });
  it("enforces completion prerequisites in both directions", () => {
    const tasks = [t("a"), t("b", ["a"])];
    expect(() => setTaskCompletion(tasks, "b", true)).toThrow();
    const done = setTaskCompletion(
      setTaskCompletion(tasks, "a", true),
      "b",
      true,
    );
    expect(() => setTaskCompletion(done, "a", false)).toThrow();
  });
  it("calculates dates and overdue state without timezone drift", () => {
    expect(
      taskState(t("a", [], 1), "2028-03-01", [], "2028-03-01"),
    ).toMatchObject({ due: "2028-02-29", overdue: true });
  });
  it("marks critical deadlines approaching", () =>
    expect(
      taskState(t("a", [], 0), "2028-03-02", [], "2028-03-01").approaching,
    ).toBe(true));
});
