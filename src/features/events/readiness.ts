import type { Snapshot } from "../../schemas/plan";
import { budgetTotals } from "../budget/engine";
import { orderTasks, taskState } from "../timeline/engine";
import { today } from "../../utils/dates";
export function readiness(s: Snapshot, now = today()) {
  const required = s.plan.tasks.filter((t) => t.required);
  const important = s.plan.vendors.filter((v) => v.important);
  const taskPoints = required.length
    ? (40 * required.filter((t) => t.completed).length) / required.length
    : 40;
  const vendorPoints = important.length
    ? (20 * important.filter((v) => v.status === "booked").length) /
      important.length
    : 20;
  const within = !budgetTotals(
    s.plan.budget,
    s.event.budgetMinor,
    s.event.guests,
    s.event.contingencyPercent,
  ).overBudget;
  const late = s.plan.tasks.filter(
    (t) =>
      t.priority === "high" &&
      (taskState(t, s.event.date, s.plan.tasks, now).overdue ||
        taskState(t, s.event.date, s.plan.tasks, now).approaching),
  );
  let validGraph = true;
  try {
    orderTasks(s.plan.tasks);
  } catch {
    validGraph = false;
  }
  const unresolved = s.plan.risks.filter((r) => !r.resolved);
  const riskPoints = s.plan.risks.length
    ? (10 * (s.plan.risks.length - unresolved.length)) / s.plan.risks.length
    : 10;
  const score = Math.round(
    taskPoints +
      vendorPoints +
      (within ? 20 : 0) +
      (validGraph && late.length === 0 ? 10 : 0) +
      riskPoints,
  );
  const reasons = [
    `${required.filter((t) => t.completed).length}/${required.length} required tasks complete (40 points).`,
    `${important.filter((v) => v.status === "booked").length}/${important.length} important vendor categories booked (20 points).`,
    within
      ? "Plan is within the budget including contingency (20 points)."
      : "Plan is over budget. Review allocations (0/20 points).",
    validGraph
      ? `${late.length} critical tasks overdue or due within 7 days (10 points if none).`
      : "Invalid task dependencies (0/10 points).",
    `${unresolved.length} unresolved risks (10 points, proportional to resolution).`,
  ];
  const critical =
    !within ||
    !validGraph ||
    unresolved.some((r) => r.severity === "high") ||
    late.length > 0;
  return {
    score,
    label: critical
      ? "Needs attention"
      : score >= 85
        ? "Well prepared"
        : "Taking shape",
    reasons,
  };
}
