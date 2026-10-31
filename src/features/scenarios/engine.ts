import { createId } from "../../utils/id";
import type { EventInput } from "../../schemas/event";
import { newEventSchema } from "../../schemas/event";
import type { Snapshot, Workspace } from "../../schemas/plan";
import { validateSnapshot, validateWorkspace } from "../../services/validation";
import { budgetTotals } from "../budget/engine";
export function proposeScenario(
  current: Snapshot,
  event: EventInput,
  lostVendorId: string,
): Snapshot {
  newEventSchema.parse(event);
  if (event.currency !== current.event.currency)
    throw new Error(
      "Scenario currency must match. Currency conversion is not supported.",
    );
  if (lostVendorId && !current.plan.vendors.some((v) => v.id === lostVendorId))
    throw new Error("Vendor was not found.");
  const next = structuredClone(current);
  next.event = event;
  next.scenarioNote =
    "Scenario inputs changed. Existing costs, quotations and completed work are retained. Review vendor availability, guest-dependent costs and deadlines; no savings are assumed.";
  if (lostVendorId) {
    next.plan.vendors = next.plan.vendors.map((v) =>
      v.id === lostVendorId ? { ...v, status: "cancelled" } : v,
    );
    const baseId = `lost-${lostVendorId}`.slice(0, 58);
    let riskId = baseId;
    let suffix = 1;
    while (next.plan.risks.some((r) => r.id === riskId)) {
      riskId = `${baseId}-${suffix++}`;
    }
    const risk = {
      id: riskId,
      title: "A vendor is unavailable",
      severity: "high" as const,
      mitigation:
        "Review cancellation costs and secure an alternative. Existing budget is retained until you edit it.",
      resolved: false,
    };
    next.plan.risks = next.plan.risks.concat(risk);
  }
  return validateSnapshot(next);
}
export function comparison(before: Snapshot, after: Snapshot) {
  const b = budgetTotals(
    before.plan.budget,
    before.event.budgetMinor,
    before.event.guests,
    before.event.contingencyPercent,
  );
  const a = budgetTotals(
    after.plan.budget,
    after.event.budgetMinor,
    after.event.guests,
    after.event.contingencyPercent,
  );
  return {
    before: b,
    after: a,
    budgetDelta: after.event.budgetMinor - before.event.budgetMinor,
    guestDelta: after.event.guests - before.event.guests,
    plannedDelta: a.planned - b.planned,
  };
}
export function revise(
  workspace: Workspace,
  snapshot: Snapshot,
  label: string,
): Workspace {
  if (workspace.revisions.length >= 30)
    throw new Error(
      "This event has 30 revisions. Export a backup and start a new event; history will not be discarded.",
    );
  return validateWorkspace({
    snapshot: validateSnapshot(snapshot),
    revisions: [
      ...workspace.revisions,
      {
        id: createId(),
        savedAt: new Date().toISOString(),
        label,
        snapshot: workspace.snapshot,
      },
    ],
  });
}
