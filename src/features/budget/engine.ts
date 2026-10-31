import { MAX_MINOR, minorSchema, type Currency } from "../../schemas/event";
import { budgetItemSchema, type BudgetItem } from "../../schemas/plan";
export function decimals(currency: Currency): number {
  return currency === "JPY" ? 0 : 2;
}
// Decimal strings avoid floating-point multiplication errors (e.g. 1.005).
export function toMinor(input: string, currency: Currency): number {
  if (!/^\d{1,12}(?:\.\d{1,6})?$/.test(input.trim()))
    throw new Error(
      "Enter a positive amount using digits and a decimal point.",
    );
  const [whole = "0", fraction = ""] = input.trim().split(".");
  const places = decimals(currency);
  const padded = fraction.padEnd(places + 1, "0");
  const rounded =
    BigInt(whole) * 10n ** BigInt(places) +
    BigInt(padded.slice(0, places) || "0") +
    (Number(padded[places] ?? 0) >= 5 ? 1n : 0n);
  if (rounded > BigInt(MAX_MINOR))
    throw new Error("Amount exceeds the supported limit.");
  return minorSchema.parse(Number(rounded));
}
export function amountString(minor: number, currency: Currency): string {
  return (minorSchema.parse(minor) / 10 ** decimals(currency)).toFixed(
    decimals(currency),
  );
}
export function money(minor: number, currency: Currency): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: decimals(currency),
  }).format(minor / 10 ** decimals(currency));
}
export function reserveFor(limit: number, percent: number): number {
  minorSchema.parse(limit);
  if (!Number.isInteger(percent) || percent < 0 || percent > 30)
    throw new Error("Contingency must be an integer from 0 to 30.");
  return Number((BigInt(limit) * BigInt(percent) + 50n) / 100n);
}
export function budgetTotals(
  items: BudgetItem[],
  limit: number,
  guests: number,
  percent = 10,
) {
  minorSchema.parse(limit);
  if (!Number.isInteger(guests) || guests < 1 || guests > 100000)
    throw new Error("Guest count must be between 1 and 100,000.");
  if (items.length > 20) throw new Error("At most 20 budget categories.");
  const ids = new Set<string>();
  const total = items.reduce((sum, raw) => {
    const item = budgetItemSchema.parse(raw);
    if (ids.has(item.id)) throw new Error("Duplicate budget ID.");
    ids.add(item.id);
    return sum + item.amountMinor;
  }, 0);
  if (!Number.isSafeInteger(total))
    throw new Error("Budget exceeds safe arithmetic range.");
  const contingency = reserveFor(limit, percent);
  const planned = total + contingency;
  return {
    total,
    contingency,
    planned,
    remaining: limit - planned,
    overBudget: planned > limit,
    costPerGuest: Math.round(planned / guests),
    quoted: items
      .filter((i) => i.basis === "quote")
      .reduce((a, i) => a + i.amountMinor, 0),
    confirmed: items
      .filter((i) => i.basis === "confirmed")
      .reduce((a, i) => a + i.amountMinor, 0),
  };
}
export function changeAllocation(
  items: BudgetItem[],
  id: string,
  amountMinor: number,
  basis: BudgetItem["basis"],
): BudgetItem[] {
  minorSchema.parse(amountMinor);
  if (!items.some((i) => i.id === id))
    throw new Error("Budget category was not found.");
  return items.map((i) =>
    i.id === id ? budgetItemSchema.parse({ ...i, amountMinor, basis }) : i,
  );
}
