import { afterEach, describe, expect, it, vi } from "vitest";
import { AIGateway } from "./gateway";
import { demoDraft } from "../../services/demo";
import { eventFixture, snapshotFixture } from "../../test/fixtures";
const gateway = (text: string) => new AIGateway(async () => text, 500, 0);
afterEach(() => vi.useRealTimers());
describe("AI boundary", () => {
  it("accepts valid structured output", async () => {
    const e = eventFixture();
    const s = await gateway(JSON.stringify(demoDraft(e))).generate(e);
    expect(s.source).toBe("gemini");
    expect(s.plan.budget.every((b) => b.basis === "estimate")).toBe(true);
    expect(s.plan.vendors.every((v) => v.name === "")).toBe(true);
  });
  it("rejects malformed JSON", async () =>
    await expect(gateway("{oops").generate(eventFixture())).rejects.toThrow(
      /malformed/,
    ));
  it("rejects missing schema fields", async () =>
    await expect(gateway("{}").generate(eventFixture())).rejects.toThrow());
  it("rejects empty output", async () =>
    await expect(gateway("  ").generate(eventFixture())).rejects.toThrow(
      /empty/,
    ));
  it("propagates rejected services and rate limits", async () => {
    const g = new AIGateway(
      async () => {
        throw new Error("429 quota");
      },
      500,
      0,
    );
    await expect(g.generate(eventFixture())).rejects.toThrow(/429/);
  });
  it("times out and signals cancellation", async () => {
    vi.useFakeTimers();
    const g = new AIGateway(
      (_p, _k, signal) =>
        new Promise((_, reject) =>
          signal.addEventListener("abort", () => reject(signal.reason)),
        ),
      20,
      0,
    );
    const check = expect(g.generate(eventFixture())).rejects.toThrow(
      /timed out/,
    );
    await vi.advanceTimersByTimeAsync(30);
    await check;
  });
  it("rejects over-budget proposals", async () => {
    const e = eventFixture();
    const d = demoDraft(e);
    if (d.budget[0]) d.budget[0].amountMinor = e.budgetMinor;
    await expect(gateway(JSON.stringify(d)).generate(e)).rejects.toThrow(
      /exceeds/,
    );
  });
  it("rejects invalid dependency graphs", async () => {
    const e = eventFixture();
    const d = demoDraft(e);
    if (d.tasks[0]) d.tasks[0].dependencies = ["missing"];
    await expect(gateway(JSON.stringify(d)).generate(e)).rejects.toThrow(
      /Missing/,
    );
  });
  it("prevents concurrent duplicate requests", async () => {
    let release: (value: string) => void = () => {};
    const transport = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );
    const g = new AIGateway(transport, 500, 0);
    const one = g.generate(eventFixture());
    await Promise.resolve();
    await expect(g.generate(eventFixture())).rejects.toThrow(/already/);
    release(JSON.stringify(demoDraft(eventFixture())));
    await one;
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("cancels a request and retains the lock until it settles", async () => {
    let release: (value: string) => void = () => {};
    const g = new AIGateway(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
      500,
      0,
    );
    const c = new AbortController();
    const one = g.generate(eventFixture(), c.signal);
    await Promise.resolve();
    c.abort();
    await expect(one).rejects.toThrow(/cancelled/);
    await expect(g.generate(eventFixture())).rejects.toThrow(/already/);
    release("{}");
    await Promise.resolve();
  });
  it("rejects oversized output", async () =>
    await expect(
      gateway("x".repeat(100001)).generate(eventFixture()),
    ).rejects.toThrow(/100 KB/));
  it("validates user input before making a request", async () => {
    const transport = vi.fn(async () => "{}");
    const g = new AIGateway(transport);
    await expect(
      g.generate({ ...eventFixture(), guests: NaN }),
    ).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
  it("does not send vendor contact details with scenarios", async () => {
    const transport = vi.fn(async (prompt: string) => {
      expect(prompt).toContain("DATA:");
      return JSON.stringify({
        alternatives: ["Get a revised quote."],
        assumptions: [],
      });
    });
    const s = snapshotFixture();
    if (s.plan.vendors[0])
      s.plan.vendors[0].contact = "private@example.invalid";
    await new AIGateway(transport, 500, 0).alternatives(s);
    expect(transport.mock.calls[0]?.[0]).not.toContain(
      "private@example.invalid",
    );
  });
  it("validates alternative output", async () =>
    await expect(
      gateway('{"alternatives":[],"assumptions":[]}').alternatives(
        snapshotFixture(),
      ),
    ).rejects.toThrow());
});
