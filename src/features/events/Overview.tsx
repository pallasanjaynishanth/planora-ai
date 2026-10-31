import { ArrowUpRight, Check, AlertCircle, Sparkles } from "lucide-react";
import type { Snapshot } from "../../schemas/plan";
import { readiness } from "./readiness";
import { budgetTotals, money } from "../budget/engine";
import { orderTasks, taskState } from "../timeline/engine";
import { prettyDate } from "../../utils/dates";
export default function Overview({
  snapshot,
  update,
  navigate,
}: {
  snapshot: Snapshot;
  update: (s: Snapshot) => void;
  navigate: (tab: "budget" | "timeline" | "vendors" | "scenarios") => void;
}) {
  const { event, plan } = snapshot;
  const ready = readiness(snapshot);
  const totals = budgetTotals(
    plan.budget,
    event.budgetMinor,
    event.guests,
    event.contingencyPercent,
  );
  const tasks = orderTasks(plan.tasks)
    .filter((t) => !t.completed)
    .slice(0, 3);
  return (
    <>
      <div className="overview-grid">
        <article className="panel story-card">
          <span className="eyebrow">
            <Sparkles size={14} /> THE BIG PICTURE
          </span>
          <h2>
            A day with your
            <br />
            <em>signature on it.</em>
          </h2>
          {snapshot.scenarioNote && (
            <p className="muted">
              <strong>
                Original narrative — review against your updated brief.
              </strong>{" "}
              Your current plan is for {event.guests} guests in {event.location}{" "}
              on {prettyDate(event.date)}.
            </p>
          )}
          <p>{plan.summary}</p>
          {snapshot.scenarioNote && (
            <p className="info">{snapshot.scenarioNote}</p>
          )}
          <div className="idea-list">
            {plan.ideas.map((idea, i) => (
              <div key={i}>
                <span>0{i + 1}</span>
                <p>{idea}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="panel readiness-card">
          <span className="eyebrow">EVENT READINESS</span>
          <div className="readiness-value">
            <strong>
              {ready.score}
              <small>/100</small>
            </strong>
            <span className="pill">{ready.label}</span>
          </div>
          <progress
            value={ready.score}
            max="100"
            aria-label="Event readiness"
          />
          <p>Built from your checklist, bookings, budget and risks.</p>
          <ul className="readiness-reasons">
            {ready.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <button className="text-button" onClick={() => navigate("timeline")}>
            Take the next step <ArrowUpRight size={16} />
          </button>
        </article>
      </div>
      <div className="overview-grid equal">
        <article className="panel">
          <div className="card-heading">
            <h3>Your budget at a glance</h3>
            <button
              className="text-button"
              onClick={() => navigate("budget")}
              aria-label="Open budget"
            >
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="budget-caption">
            <strong>{money(totals.planned, event.currency)}</strong>
            <span>planned, including reserve</span>
          </div>
          <div className="allocation-bars" aria-hidden="true">
            {plan.budget.map((b, i) => (
              <div
                className={`bar color-${i % 5}`}
                key={b.id}
                style={{ flex: b.amountMinor }}
              />
            ))}
          </div>
          <ul className="allocation-list">
            {plan.budget.map((b, i) => (
              <li key={b.id}>
                <span>
                  <i className={`swatch color-${i % 5}`} />
                  {b.label}
                </span>
                <strong>{money(b.amountMinor, event.currency)}</strong>
              </li>
            ))}
            <li>
              <span>Contingency reserve</span>
              <strong>{money(totals.contingency, event.currency)}</strong>
            </li>
          </ul>
          <p className={totals.overBudget ? "error" : "muted"}>
            {totals.overBudget
              ? "Over budget by "
              : "Remaining after reserve: "}
            {money(Math.abs(totals.remaining), event.currency)}
          </p>
        </article>
        <article className="panel">
          <div className="card-heading">
            <h3>A little closer, every day</h3>
            <button
              className="text-button"
              onClick={() => navigate("timeline")}
              aria-label="Open checklist"
            >
              <ArrowUpRight size={20} />
            </button>
          </div>
          <p className="muted">
            Your next unfinished tasks, in dependency order.
          </p>
          <div className="next-tasks">
            {tasks.map((t, i) => (
              <div key={t.id}>
                <span className="step-circle">{i + 1}</span>
                <div>
                  <strong>{t.title}</strong>
                  <small>
                    {prettyDate(taskState(t, event.date, plan.tasks).due)} ·{" "}
                    {t.priority} priority
                  </small>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p>
                <Check size={18} /> All tasks complete.
              </p>
            )}
          </div>
          <button
            className="button secondary small"
            onClick={() => navigate("timeline")}
          >
            View the full timeline <ArrowUpRight size={15} />
          </button>
        </article>
      </div>
      <section className="panel risk-panel">
        <div className="section-heading compact">
          <span className="eyebrow">
            <AlertCircle size={15} /> A LITTLE FORESIGHT
          </span>
          <h3>Keep these on your radar.</h3>
          <p>Resolve a risk only after taking the mitigation action.</p>
        </div>
        <div className="risk-grid">
          {plan.risks.map((r) => (
            <article key={r.id}>
              <span className="pill">
                {r.severity} priority · {r.resolved ? "Resolved" : "Open"}
              </span>
              <h4>{r.title}</h4>
              <p>{r.mitigation}</p>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={r.resolved}
                  onChange={(e) =>
                    update({
                      ...snapshot,
                      plan: {
                        ...plan,
                        risks: plan.risks.map((x) =>
                          x.id === r.id
                            ? { ...x, resolved: e.target.checked }
                            : x,
                        ),
                      },
                    })
                  }
                />
                Mitigation completed
              </label>
            </article>
          ))}
        </div>
        {plan.risks.length === 0 && (
          <p>No risks were listed. Review the plan for omissions.</p>
        )}
      </section>
      <div className="overview-grid equal">
        <section className="panel">
          <h3>Assumptions & open questions</h3>
          <ul>
            {plan.assumptions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <h4>Still to confirm</h4>
          <ul>
            {plan.missingInfo.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
        <section className="panel sage-panel">
          <span className="eyebrow">LEAVE ROOM FOR POSSIBILITY</span>
          <h3>Another way to bring it together.</h3>
          <ul>
            {plan.alternatives.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <button className="text-button" onClick={() => navigate("scenarios")}>
            Explore a what-if <ArrowUpRight size={16} />
          </button>
        </section>
      </div>
    </>
  );
}
