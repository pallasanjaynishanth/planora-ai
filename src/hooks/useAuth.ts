import { useEffect, useState } from "react";
import { errorMessage } from "../services/errors";
export const isFirebaseMode = import.meta.env.VITE_APP_MODE === "firebase";
export function useAuth() {
  const [user, setUser] = useState<{
    uid: string;
    email: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(isFirebaseMode);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    if (isFirebaseMode)
      void (async () => {
        const [{ firebaseClient }, { onAuthStateChanged }] = await Promise.all([
          import("../lib/firebase/client"),
          import("firebase/auth"),
        ]);
        const c = firebaseClient();
        await c.ready;
        if (!active) return;
        unsubscribe = onAuthStateChanged(c.auth, (value) => {
          if (active) {
            setUser(value ? { uid: value.uid, email: value.email } : null);
            setLoading(false);
          }
        });
      })().catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  async function authenticate(
    email: string,
    password: string,
    register: boolean,
  ) {
    const [{ firebaseClient }, auth] = await Promise.all([
      import("../lib/firebase/client"),
      import("firebase/auth"),
    ]);
    const c = firebaseClient();
    await c.ready;
    if (register)
      await auth.createUserWithEmailAndPassword(c.auth, email, password);
    else await auth.signInWithEmailAndPassword(c.auth, email, password);
  }
  async function signOut() {
    const [{ firebaseClient }, auth] = await Promise.all([
      import("../lib/firebase/client"),
      import("firebase/auth"),
    ]);
    await auth.signOut(firebaseClient().auth);
  }
  return { user, loading, error, authenticate, signOut };
}
