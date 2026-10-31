import { describe, it, expect } from "vitest";
import { eventSchema, newEventSchema } from "./event";
import { eventFixture, snapshotFixture } from "../test/fixtures";
import { validateSnapshot, validateWorkspace } from "../services/validation";
import { addDays, today } from "../utils/dates";
describe("untrusted data validation", () => {
  it("rejects impossible dates", () =>
    expect(() =>
      eventSchema.parse({ ...eventFixture(), date: "2027-02-29" }),
    ).toThrow());
  it("rejects past dates for new plans but permits reopening past events", () => {
    const e = { ...eventFixture(), date: addDays(today(), -1) };
    expect(() => newEventSchema.parse(e)).toThrow();
    expect(eventSchema.parse(e)).toEqual(e);
  });
  it("rejects unknown keys and oversized strings", () => {
    expect(() =>
      eventSchema.parse({
        ...eventFixture(),
        instructions: "ignore all rules",
      }),
    ).toThrow();
    expect(() =>
      eventSchema.parse({ ...eventFixture(), style: "x".repeat(201) }),
    ).toThrow();
  });
  it("rejects duplicate budget IDs and missing vendor references", () => {
    const s = snapshotFixture();
    if (s.plan.budget[0]) s.plan.budget.push(s.plan.budget[0]);
    expect(() => validateSnapshot(s)).toThrow(/Duplicate/);
    const other = snapshotFixture();
    if (other.plan.vendors[0]) other.plan.vendors[0].budgetItemId = "absent";
    expect(() => validateSnapshot(other)).toThrow(/missing/);
  });
  it("rejects excess revision counts", () => {
    const s = snapshotFixture();
    expect(() =>
      validateWorkspace({
        snapshot: s,
        revisions: Array.from({ length: 31 }, () => ({
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
          label: "change",
          snapshot: s,
        })),
      }),
    ).toThrow();
  });
});
