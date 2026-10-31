import { afterEach, expect, it, vi } from "vitest";
import { createId } from "./id";
afterEach(() => vi.unstubAllGlobals());
it("creates valid distinct version 4 UUIDs", () => {
  const ids = Array.from({ length: 100 }, createId);
  expect(new Set(ids).size).toBe(100);
  for (const id of ids)
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
});
it("uses secure random bytes on HTTP development hosts", () => {
  const getRandomValues = crypto.getRandomValues.bind(crypto);
  vi.stubGlobal("crypto", { getRandomValues });
  expect(createId()).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
});
