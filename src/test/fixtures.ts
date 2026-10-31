import type { EventInput } from "../schemas/event";
import { addDays, today } from "../utils/dates";
import { demoDraft } from "../services/demo";
import { materializeDraft } from "../services/validation";
export function eventFixture(): EventInput {
  return {
    name: "Sample celebration",
    type: "community",
    date: addDays(today(), 120),
    location: "Example City",
    guests: 100,
    budgetMinor: 1000000,
    currency: "INR",
    contingencyPercent: 10,
    style: "Seasonal garden",
    cultural: "",
    accessibility: "Step-free access",
    dietary: "",
    priorities: ["food"],
  };
}
export function snapshotFixture() {
  const e = eventFixture();
  return materializeDraft(demoDraft(e), e, "demo");
}
