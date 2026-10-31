import { z } from "zod";
import { workspaceSchema, type Workspace } from "../schemas/plan";
import { validateWorkspace } from "./validation";
export const recordSchema = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    updatedAt: z.string().datetime(),
    workspace: workspaceSchema,
  })
  .strict();
export type SavedRecord = z.infer<typeof recordSchema>;
export type Cursor = { id: string; seconds: number; nanoseconds: number };
export interface Repository {
  list(cursor?: Cursor): Promise<{ records: SavedRecord[]; next?: Cursor }>;
  save(
    id: string,
    workspace: Workspace,
    expectedVersion: number,
  ): Promise<SavedRecord>;
  remove(id: string, expectedVersion: number): Promise<void>;
}
const key = "planora.demo.v1";
function readLocal(): SavedRecord[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const records = z.array(recordSchema).max(100).parse(JSON.parse(raw));
  records.forEach((r) => validateWorkspace(r.workspace));
  return records;
}
export const demoRepository: Repository = {
  async list() {
    return {
      records: readLocal().sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    };
  },
  async save(id, workspace, expectedVersion) {
    z.string().uuid().parse(id);
    validateWorkspace(workspace);
    const records = readLocal();
    const existing = records.find((r) => r.id === id);
    if ((existing?.version ?? 0) !== expectedVersion)
      throw new Error(
        "This plan changed in another tab. Reopen the saved plan before saving again.",
      );
    if (!existing && records.length >= 100)
      throw new Error(
        "Demo storage supports 100 plans. Export and delete a plan first.",
      );
    const record = recordSchema.parse({
      id,
      version: expectedVersion + 1,
      updatedAt: new Date().toISOString(),
      workspace,
    });
    try {
      localStorage.setItem(
        key,
        JSON.stringify([...records.filter((r) => r.id !== id), record]),
      );
    } catch {
      throw new Error(
        "Browser storage is full or unavailable. Save did not succeed. Export JSON to keep a copy.",
      );
    }
    return record;
  },
  async remove(id, expectedVersion) {
    const records = readLocal();
    const found = records.find((r) => r.id === id);
    if (!found || found.version !== expectedVersion)
      throw new Error(
        "Saved plan changed. Refresh your saved plans before deleting.",
      );
    localStorage.setItem(
      key,
      JSON.stringify(records.filter((r) => r.id !== id)),
    );
  },
};
export async function repository(): Promise<Repository> {
  if (import.meta.env.VITE_APP_MODE !== "firebase") return demoRepository;
  return (await import("../lib/firebase/repository")).firestoreRepository;
}
