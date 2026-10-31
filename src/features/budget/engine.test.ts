import { describe, expect, it } from "vitest";
import {
  amountString,
  budgetTotals,
  changeAllocation,
  reserveFor,
  toMinor,
} from "./engine";
import type { BudgetItem } from "../../schemas/plan";
const item = (amountMinor: number, id = "one"): BudgetItem => ({
  id,
  label: "Venue",
  amountMinor,
  basis: "estimate",
  assumption: "Example",
});
describe("integer budget engine", () => {
  it("calculates exact totals, remaining and per guest", () => {
    const b = budgetTotals([item(101), item(202, "two")], 1000, 10, 10);
    expect(b.total).toBe(303);
    expect(b.contingency).toBe(100);
    expect(b.remaining).toBe(597);
    expect(b.costPerGuest).toBe(40);
  });
  it("detects over budget including contingency", () =>
    expect(budgetTotals([item(950)], 1000, 10, 10).overBudget).toBe(true));
  it("accepts zero-value categories", () =>
    expect(budgetTotals([item(0)], 100, 1, 0).total).toBe(0));
  it("handles an empty budget list", () =>
    expect(budgetTotals([], 100, 1, 10).remaining).toBe(90));
  it.each([-1, NaN, Infinity, -Infinity, 100000000001, 1.5])(
    "rejects invalid amount %s",
    (v) => expect(() => budgetTotals([item(v)], 1000, 1)).toThrow(),
  );
  it.each([-1, NaN, Infinity, 100000000001])("rejects invalid limit %s", (v) =>
    expect(() => budgetTotals([], v, 1)).toThrow(),
  );
  it.each([0, -1, NaN, 1.1, 100001])("rejects invalid guest count %s", (v) =>
    expect(() => budgetTotals([], 100, v)).toThrow(),
  );
  it("rounds decimal ties deterministically", () => {
    expect(toMinor("1.005", "USD")).toBe(101);
    expect(toMinor("1.004", "INR")).toBe(100);
    expect(toMinor("0.009", "EUR")).toBe(1);
    expect(toMinor("99.999", "GBP")).toBe(10000);
  });
  it("supports integer-yen currency", () => {
    expect(toMinor("2.5", "JPY")).toBe(3);
    expect(amountString(25, "JPY")).toBe("25");
  });
  it.each(["-1", "NaN", "Infinity", "1e3", "12,000", "", "1000000000000"])(
    "rejects malformed or extreme input %s",
    (v) => expect(() => toMinor(v, "USD")).toThrow(),
  );
  it("rounds contingency half up", () => expect(reserveFor(105, 10)).toBe(11));
  it.each([-1, 31, NaN, 1.2])("rejects invalid contingency %s", (v) =>
    expect(() => reserveFor(100, v)).toThrow(),
  );
  it("preserves other allocations and records a user quote", () => {
    const original = [item(100), item(200, "two")];
    const next = changeAllocation(original, "one", 500, "quote");
    expect(next[0]?.amountMinor).toBe(500);
    expect(original[0]?.amountMinor).toBe(100);
    expect(next[1]).toEqual(original[1]);
    expect(budgetTotals(next, 1000, 2).quoted).toBe(500);
  });
  it("rejects duplicate and missing IDs", () => {
    expect(() => budgetTotals([item(1), item(2)], 100, 1)).toThrow();
    expect(() => changeAllocation([], "missing", 1, "estimate")).toThrow();
  });
});
