import {
  collection,
  doc,
  documentId,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { z } from "zod";
import { firebaseClient } from "./client";
import { validateWorkspace } from "../../services/validation";
import { recordSchema, type Repository } from "../../services/repository";
function context() {
  const c = firebaseClient();
  const uid = c.auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to access saved plans.");
  return { ...c, uid };
}
function decode(id: string, data: DocumentData) {
  if (!(data.updatedAt instanceof Timestamp))
    throw new Error("Saved plan has an invalid timestamp.");
  const record = recordSchema.parse({
    id,
    version: data.version,
    updatedAt: data.updatedAt.toDate().toISOString(),
    workspace: data.workspace,
  });
  validateWorkspace(record.workspace);
  return record;
}
export const firestoreRepository: Repository = {
  async list(cursor) {
    const c = context();
    await c.ready;
    const constraints: QueryConstraint[] = [
      orderBy("updatedAt", "desc"),
      orderBy(documentId()),
    ];
    if (cursor)
      constraints.push(
        startAfter(
          new Timestamp(cursor.seconds, cursor.nanoseconds),
          cursor.id,
        ),
      );
    constraints.push(limit(25));
    const result = await getDocsFromServer(
      query(collection(c.db, "users", c.uid, "events"), ...constraints),
    );
    const records = result.docs.map((d) => decode(d.id, d.data()));
    const last = result.docs.at(-1);
    const updatedAt: unknown = last?.data().updatedAt;
    return {
      records,
      next:
        result.size === 25 && last && updatedAt instanceof Timestamp
          ? {
              id: last.id,
              seconds: updatedAt.seconds,
              nanoseconds: updatedAt.nanoseconds,
            }
          : undefined,
    };
  },
  async save(id, workspace, expectedVersion) {
    z.string().uuid().parse(id);
    z.number().int().min(0).parse(expectedVersion);
    const validated = validateWorkspace(workspace);
    const c = context();
    await c.ready;
    const ref = doc(c.db, "users", c.uid, "events", id);
    await runTransaction(c.db, async (transaction) => {
      const current = await transaction.get(ref);
      if ((current.exists() ? current.data().version : 0) !== expectedVersion)
        throw new Error(
          "This plan changed elsewhere. Reopen the saved version before saving again.",
        );
      transaction.set(ref, {
        ownerId: c.uid,
        schemaVersion: 1,
        version: expectedVersion + 1,
        workspace: validated,
        createdAt: current.exists()
          ? current.data().createdAt
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    // Transaction resolution is server acknowledgement. No optimistic success is shown.
    return {
      id,
      version: expectedVersion + 1,
      updatedAt: new Date().toISOString(),
      workspace: validated,
    };
  },
  async remove(id, expectedVersion) {
    const c = context();
    await c.ready;
    const ref = doc(c.db, "users", c.uid, "events", id);
    await runTransaction(c.db, async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists() || snap.data().version !== expectedVersion)
        throw new Error("Saved plan changed. Refresh before deleting.");
      t.delete(ref);
    });
  },
};
