import {
  draftSchema,
  snapshotSchema,
  workspaceSchema,
  type PlanDraft,
  type Snapshot,
  type Workspace,
} from "../schemas/plan";
import { eventSchema, type EventInput } from "../schemas/event";
import { budgetTotals } from "../features/budget/engine";
import { orderTasks } from "../features/timeline/engine";
function unique(items: { id: string }[], kind: string) {
  if (new Set(items.map((i) => i.id)).size !== items.length)
    throw new Error(`Duplicate ${kind} IDs.`);
}
export function validateSnapshot(input: unknown): Snapshot {
  const s = snapshotSchema.parse(input);
  unique(s.plan.budget, "budget");
  unique(s.plan.vendors, "vendor");
  unique(s.plan.risks, "risk");
  orderTasks(s.plan.tasks);
  for (const task of s.plan.tasks)
    if (
      task.completed &&
      task.dependencies.some(
        (id) => !s.plan.tasks.find((t) => t.id === id)?.completed,
      )
    )
      throw new Error("Completed task has an unfinished prerequisite.");
  for (const vendor of s.plan.vendors)
    if (!s.plan.budget.some((b) => b.id === vendor.budgetItemId))
      throw new Error("Vendor refers to a missing budget category.");
  for (const vendor of s.plan.vendors)
    if (vendor.status === "booked" && !vendor.name.trim())
      throw new Error("A booked vendor needs a user-entered name.");
  budgetTotals(
    s.plan.budget,
    s.event.budgetMinor,
    s.event.guests,
    s.event.contingencyPercent,
  );
  return s;
}
export function validateWorkspace(input: unknown): Workspace {
  const w = workspaceSchema.parse(input);
  validateSnapshot(w.snapshot);
  w.revisions.forEach((r) => validateSnapshot(r.snapshot));
  unique(w.revisions, "revision");
  if (new TextEncoder().encode(JSON.stringify(w)).length > 700000)
    throw new Error(
      "Plan exceeds the 700 KB save limit. Export a backup and start a new event.",
    );
  return w;
}
export function materializeDraft(
  raw: unknown,
  event: EventInput,
  source: Snapshot["source"],
): Snapshot {
  const draft: PlanDraft = draftSchema.parse(raw);
  eventSchema.parse(event);
  const snapshot = validateSnapshot({
    event,
    source,
    scenarioNote: "",
    plan: {
      ...draft,
      budget: draft.budget.map((b) => ({ ...b, basis: "estimate" })),
      tasks: draft.tasks.map((t) => ({ ...t, completed: false })),
      vendors: draft.vendors.map((v) => ({
        ...v,
        name: "",
        contact: "",
        quotationMinor: null,
        status: "researching",
        cancellation: "",
      })),
      risks: draft.risks.map((r) => ({ ...r, resolved: false })),
    },
  });
  if (
    budgetTotals(
      snapshot.plan.budget,
      event.budgetMinor,
      event.guests,
      event.contingencyPercent,
    ).overBudget
  )
    throw new Error(
      "The AI proposal exceeds your budget including contingency. It was not applied. Try a revised request.",
    );
  return snapshot;
}
