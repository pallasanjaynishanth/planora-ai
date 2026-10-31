import { useState } from "react";
import { errorMessage } from "../services/errors";
export function AuthPanel({
  authenticate,
  onDone,
}: {
  authenticate: (
    email: string,
    password: string,
    register: boolean,
  ) => Promise<void>;
  onDone: () => void;
}) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="auth-panel panel">
      <span className="eyebrow">A SPACE FOR YOUR OCCASIONS</span>
      <h1>{register ? "Begin your next chapter." : "Welcome back."}</h1>
      <p>
        Sign in to generate plans with Gemini and save them to your own Firebase
        account.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          void authenticate(
            String(f.get("email")),
            String(f.get("password")),
            register,
          )
            .then(onDone)
            .catch((e) => setError(errorMessage(e)))
            .finally(() => setBusy(false));
        }}
      >
        <fieldset disabled={busy}>
          <legend className="sr-only">
            {register ? "Create account" : "Sign in"}
          </legend>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 12 : 1}
              maxLength={128}
              required
            />
            {register && (
              <small>
                Use at least 12 characters. Firebase password policy is
                configured in your project.
              </small>
            )}
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="button primary" type="submit">
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
