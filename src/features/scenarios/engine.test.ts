import { describe, it, expect } from "vitest";
import { proposeScenario, comparison, revise } from "./engine";
import { snapshotFixture } from "../../test/fixtures";
import { readiness } from "../events/readiness";
describe("scenarios and readiness", () => {
  it("retains existing costs and exposes budget shortfalls", () => {
    const s = snapshotFixture();
    const next = proposeScenario(
      s,
      { ...s.event, budgetMinor: 500000, guests: 200 },
      "",
    );
    expect(next.plan.budget).toEqual(s.plan.budget);
    expect(comparison(s, next).after.overBudget).toBe(true);
    expect(s.event.guests).toBe(100);
  });
  it("retains user data and flags vendor loss", () => {
    const s = snapshotFixture();
    const vendor = s.plan.vendors[0];
    if (!vendor) throw new Error("Missing fixture");
    vendor.name = "Example Vendor";
    vendor.status = "booked";
    vendor.quotationMinor = 25000;
    const next = proposeScenario(s, s.event, vendor.id);
    expect(next.plan.vendors[0]).toMatchObject({
      name: "Example Vendor",
      quotationMinor: 25000,
      status: "cancelled",
    });
    expect(next.plan.risks.some((r) => r.id === `lost-${vendor.id}`)).toBe(
      true,
    );
  });
  it("preserves existing risks when a vendor-loss ID collides", () => {
    const s = snapshotFixture();
    const vendor = s.plan.vendors[0];
    const existing = s.plan.risks[0];
    if (!vendor || !existing) throw new Error("Missing fixture");
    existing.id = `lost-${vendor.id}`;
    const next = proposeScenario(s, s.event, vendor.id);
    expect(next.plan.risks).toContainEqual(existing);
    expect(next.plan.risks).toHaveLength(s.plan.risks.length + 1);
    expect(new Set(next.plan.risks.map((r) => r.id)).size).toBe(
      next.plan.risks.length,
    );
  });
  it("preserves previous revisions", () => {
    const s = snapshotFixture();
    const next = proposeScenario(s, { ...s.event, guests: 200 }, "");
    const w = revise({ snapshot: s, revisions: [] }, next, "Before change");
    expect(w.revisions[0]?.snapshot).toEqual(s);
    expect(w.snapshot.event.guests).toBe(200);
  });
  it("rejects currency changes", () => {
    const s = snapshotFixture();
    expect(() =>
      proposeScenario(s, { ...s.event, currency: "JPY" }, ""),
    ).toThrow(/currency/);
  });
  it("explains its exact readiness calculation", () => {
    const s = snapshotFixture();
    expect(readiness(s).score).toBe(30);
    s.plan.tasks = s.plan.tasks.map((t) => ({ ...t, completed: true }));
    s.plan.vendors = s.plan.vendors.map((v) => ({
      ...v,
      status: "booked",
      name: "Example",
    }));
    s.plan.risks = s.plan.risks.map((r) => ({ ...r, resolved: true }));
    expect(readiness(s)).toMatchObject({ score: 100, label: "Well prepared" });
    expect(readiness(s).reasons).toHaveLength(5);
  });
  it("marks over-budget plans as needing attention", () => {
    const s = snapshotFixture();
    s.event.budgetMinor = 1;
    expect(readiness(s).label).toBe("Needs attention");
  });
});
