import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "../../schemas/plan";
import type { EventInput } from "../../schemas/event";
import { EventForm } from "../events/EventForm";
import { proposeScenario, comparison } from "./engine";
import { money } from "../budget/engine";
import { taskState } from "../timeline/engine";
import { errorMessage } from "../../services/errors";
import { validateSnapshot } from "../../services/validation";
import { isFirebaseMode } from "../../hooks/useAuth";
export default function ScenarioPanel({
  snapshot,
  apply,
}: {
  snapshot: Snapshot;
  apply: (s: Snapshot) => void;
}) {
  const [candidate, setCandidate] = useState<Snapshot | null>(null);
  const [lost, setLost] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  async function preview(event: EventInput) {
    if (busy) return;
    setError("");
    setCandidate(null);
    setAck(false);
    setBusy(true);
    const request = new AbortController();
    controller.current = request;
    try {
      const proposed = proposeScenario(snapshot, event, lost);
      const advice = isFirebaseMode
        ? await (
            await import("../../lib/ai/firebase-transport")
          ).firebaseGateway.alternatives(proposed, request.signal)
        : {
            alternatives: [
              "Keep existing costs until new quotations confirm a change.",
              "Discuss a smaller scope or alternative date with your vendors.",
            ],
            assumptions: [
              "Scenario suggestions are illustrative; availability and savings have not been verified.",
            ],
          };
      const validated = validateSnapshot({
        ...proposed,
        plan: {
          ...proposed.plan,
          alternatives: advice.alternatives,
          assumptions: [
            ...proposed.plan.assumptions.slice(0, 4),
            ...advice.assumptions,
          ],
        },
      });
      if (mounted.current && !request.signal.aborted) setCandidate(validated);
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const compared = candidate ? comparison(snapshot, candidate) : null;
  const late =
    candidate?.plan.tasks.filter(
      (t) => taskState(t, candidate.event.date, candidate.plan.tasks).overdue,
    ).length ?? 0;
  return (
    <section>
      <div className="section-heading">
        <span className="eyebrow">MAKE SPACE FOR WHAT IF</span>
        <h2>Explore it before you commit.</h2>
        <p>
          Change the guest count, date, budget, setting or theme. We retain your
          existing costs and show the consequences.
        </p>
      </div>
      <div
        className="panel"
        onChange={() => {
          setCandidate(null);
          setAck(false);
        }}
      >
        <div className="field">
          <label htmlFor="lost-vendor">An unavailable vendor?</label>
          <select
            id="lost-vendor"
            value={lost}
            disabled={busy}
            onChange={(e) => setLost(e.target.value)}
          >
            <option value="">No vendor change</option>
            {snapshot.plan.vendors.map((v) => (
              <option value={v.id} key={v.id}>
                {v.category}
                {v.name ? ` — ${v.name}` : ""}
              </option>
            ))}
          </select>
        </div>
        <EventForm
          initial={snapshot.event}
          scenario
          onSubmit={(event) => void preview(event)}
          busy={busy}
        />
      </div>
      {busy && (
        <div className="info" role="status">
          Preparing a comparison.{" "}
          <button
            className="text-button"
            onClick={() => controller.current?.abort()}
          >
            Cancel generation
          </button>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {candidate && compared && (
        <section className="panel comparison" aria-label="Scenario comparison">
          <span className="eyebrow">A POSSIBILITY, NOT YET YOUR PLAN</span>
          <h3>Before you decide.</h3>
          <div className="table-scroll">
            <table>
              <caption>
                Current plan compared with the proposed scenario
              </caption>
              <thead>
                <tr>
                  <th scope="col">Planning detail</th>
                  <th scope="col">Current</th>
                  <th scope="col">Proposed</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Total budget",
                    money(snapshot.event.budgetMinor, snapshot.event.currency),
                    money(
                      candidate.event.budgetMinor,
                      candidate.event.currency,
                    ),
                  ],
                  ["Guests", snapshot.event.guests, candidate.event.guests],
                  ["Date", snapshot.event.date, candidate.event.date],
                  [
                    "Location",
                    snapshot.event.location,
                    candidate.event.location,
                  ],
                  [
                    "Theme",
                    snapshot.event.style || "Unspecified",
                    candidate.event.style || "Unspecified",
                  ],
                  [
                    "Existing category costs",
                    money(compared.before.total, snapshot.event.currency),
                    money(compared.after.total, candidate.event.currency),
                  ],
                  [
                    "Contingency reserve",
                    money(compared.before.contingency, snapshot.event.currency),
                    money(compared.after.contingency, candidate.event.currency),
                  ],
                  [
                    "Remaining budget",
                    money(compared.before.remaining, snapshot.event.currency),
                    money(compared.after.remaining, candidate.event.currency),
                  ],
                  [
                    "Planned per guest",
                    money(
                      compared.before.costPerGuest,
                      snapshot.event.currency,
                    ),
                    money(
                      compared.after.costPerGuest,
                      candidate.event.currency,
                    ),
                  ],
                ].map(([label, before, after]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{before}</td>
                    <td>{after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="info">
            {late} incomplete tasks would be overdue. Guest-dependent costs and
            vendor availability require reconfirmation. Lower cost per guest
            does not mean additional guests are funded.
          </p>
          <h4>
            {isFirebaseMode
              ? "Gemini alternatives for review"
              : "Deterministic example alternatives"}
          </h4>
          <ul>
            {candidate.plan.alternatives.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
          {compared.after.overBudget && (
            <div className="error">
              <p>
                This scenario is over budget by{" "}
                {money(-compared.after.remaining, candidate.event.currency)}.
              </p>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                I understand this plan is over budget and requires further work.
              </label>
            </div>
          )}
          <div className="actions">
            <button
              className="button primary"
              disabled={compared.after.overBudget && !ack}
              onClick={() => {
                apply(candidate);
                setCandidate(null);
              }}
            >
              Approve & apply scenario
            </button>
            <button
              className="button secondary"
              onClick={() => setCandidate(null)}
            >
              Discard proposal
            </button>
          </div>
          <p className="muted">
            Applying retains the previous plan in revision history. Save
            afterward to persist the change.
          </p>
        </section>
      )}
    </section>
  );
}
