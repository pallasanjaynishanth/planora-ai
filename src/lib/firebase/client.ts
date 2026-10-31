import { initializeApp, getApp, getApps } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { z } from "zod";
const configSchema = z.object({
  apiKey: z.string().min(10),
  authDomain: z.string().min(3),
  projectId: z.string().min(3),
  appId: z.string().min(3),
  messagingSenderId: z.string().min(1),
});
let initialized: ReturnType<typeof createClient> | undefined;
function createClient() {
  const config = configSchema.parse({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  });
  if (Object.values(config).some((v) => v.includes("YOUR_")))
    throw new Error("Replace the Firebase placeholders in .env.local first.");
  const emulators = import.meta.env.VITE_USE_EMULATORS === "true";
  if (
    import.meta.env.PROD &&
    (emulators || import.meta.env.VITE_APPCHECK_DEBUG === "true")
  )
    throw new Error("Production cannot use emulators or App Check debug mode.");
  const app = getApps().length ? getApp() : initializeApp(config);
  if (!emulators) {
    const siteKey = z
      .string()
      .min(10)
      .parse(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY);
    if (siteKey.includes("YOUR_"))
      throw new Error("Configure the reCAPTCHA Enterprise site key first.");
    if (import.meta.env.DEV && import.meta.env.VITE_APPCHECK_DEBUG === "true")
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (emulators) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  const ready = setPersistence(auth, browserSessionPersistence);
  return { app, auth, db, ready, emulators };
}
export function firebaseClient() {
  initialized ??= createClient();
  return initialized;
}
