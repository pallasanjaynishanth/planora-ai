import { describe, expect, it, vi } from "vitest";
import { demoRepository } from "./repository";
import { snapshotFixture } from "../test/fixtures";
describe("repository integration", () => {
  it("saves, reopens, edits and deletes with optimistic concurrency", async () => {
    const w = { snapshot: snapshotFixture(), revisions: [] };
    const id = crypto.randomUUID();
    const saved = await demoRepository.save(id, w, 0);
    expect(saved.version).toBe(1);
    expect((await demoRepository.list()).records[0]?.workspace).toEqual(w);
    await expect(demoRepository.save(id, w, 0)).rejects.toThrow(/changed/);
    const updated = await demoRepository.save(id, w, 1);
    expect(updated.version).toBe(2);
    await expect(demoRepository.remove(id, 1)).rejects.toThrow();
    await demoRepository.remove(id, 2);
    expect((await demoRepository.list()).records).toHaveLength(0);
  });
  it("surfaces quota failures without claiming a save", async () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    await expect(
      demoRepository.save(
        crypto.randomUUID(),
        { snapshot: snapshotFixture(), revisions: [] },
        0,
      ),
    ).rejects.toThrow(/did not succeed/);
    spy.mockRestore();
  });
  it("does not silently reset corrupted data", async () => {
    localStorage.setItem("planora.demo.v1", "broken");
    await expect(demoRepository.list()).rejects.toThrow();
    expect(localStorage.getItem("planora.demo.v1")).toBe("broken");
  });
});
