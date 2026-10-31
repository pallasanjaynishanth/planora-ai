import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { snapshotFixture } from "../../src/test/fixtures";
let env: RulesTestEnvironment;
const path = "users/alice/events/11111111-1111-4111-8111-111111111111";
const data = () => ({
  ownerId: "alice",
  schemaVersion: 1,
  version: 1,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  workspace: { snapshot: snapshotFixture(), revisions: [] },
});
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-planora",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await setDoc(
    doc(env.authenticatedContext("alice").firestore(), path),
    data(),
  );
});
afterAll(async () => {
  await env?.cleanup();
});
describe("Firestore authorization boundary", () => {
  it("owner can read and list their own events", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(db, path)));
    await assertSucceeds(getDocs(collection(db, "users/alice/events")));
  });
  it("owner can update using the next version and delete", async () => {
    const ref = doc(env.authenticatedContext("alice").firestore(), path);
    await assertSucceeds(
      updateDoc(ref, {
        version: 2,
        updatedAt: serverTimestamp(),
        "workspace.snapshot.event.name": "Updated celebration",
      }),
    );
    await assertSucceeds(deleteDoc(ref));
  });
  it("another user cannot read or list", async () => {
    const db = env.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(db, path)));
    await assertFails(getDocs(collection(db, "users/alice/events")));
  });
  it("another user cannot update or delete", async () => {
    const ref = doc(env.authenticatedContext("bob").firestore(), path);
    await assertFails(
      updateDoc(ref, { version: 2, updatedAt: serverTimestamp() }),
    );
    await assertFails(deleteDoc(ref));
  });
  it("another user cannot create under a different owner path", async () => {
    await assertFails(
      setDoc(
        doc(
          env.authenticatedContext("bob").firestore(),
          "users/alice/events/other",
        ),
        data(),
      ),
    );
  });
  it("unauthenticated access is denied", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, path)));
    await assertFails(setDoc(doc(db, "users/alice/events/other"), data()));
    await assertFails(deleteDoc(doc(db, path)));
  });
  it("cannot change owner, creation time or skip a version", async () => {
    const ref = doc(env.authenticatedContext("alice").firestore(), path);
    await assertFails(
      updateDoc(ref, {
        ownerId: "bob",
        version: 2,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(ref, {
        createdAt: new Date(0),
        version: 2,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(ref, { version: 4, updatedAt: serverTimestamp() }),
    );
  });
  it("rejects unknown document and event fields", async () => {
    const ref = doc(env.authenticatedContext("alice").firestore(), path);
    await assertFails(
      updateDoc(ref, { admin: true, version: 2, updatedAt: serverTimestamp() }),
    );
    await assertFails(
      updateDoc(ref, {
        "workspace.snapshot.event.admin": true,
        version: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("rejects negative budgets, unsupported currency and extreme guests", async () => {
    const ref = doc(env.authenticatedContext("alice").firestore(), path);
    for (const change of [
      { "workspace.snapshot.event.budgetMinor": -1 },
      { "workspace.snapshot.event.currency": "XYZ" },
      { "workspace.snapshot.event.guests": 100001 },
    ])
      await assertFails(
        updateDoc(ref, { ...change, version: 2, updatedAt: serverTimestamp() }),
      );
  });
  it("rejects oversized strings and task lists", async () => {
    const ref = doc(env.authenticatedContext("alice").firestore(), path);
    await assertFails(
      updateDoc(ref, {
        "workspace.snapshot.event.name": "x".repeat(101),
        version: 2,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(ref, {
        "workspace.snapshot.plan.tasks": Array(81).fill({}),
        version: 2,
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("denies unrelated paths", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "admin/settings"), { public: true }));
  });
});
