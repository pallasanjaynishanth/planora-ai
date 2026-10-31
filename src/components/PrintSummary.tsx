import type { Snapshot } from "../schemas/plan";
import { money, budgetTotals } from "../features/budget/engine";
import { orderTasks } from "../features/timeline/engine";
import { addDays } from "../utils/dates";
export function PrintSummary({ snapshot: s }: { snapshot: Snapshot }) {
  const totals = budgetTotals(
    s.plan.budget,
    s.event.budgetMinor,
    s.event.guests,
    s.event.contingencyPercent,
  );
  return (
    <article className="print-summary">
      <p>
        PLANORA AI · EVENT SUMMARY ·{" "}
        {s.source === "demo" ? "DETERMINISTIC EXAMPLE" : "AI-ASSISTED PLAN"}
      </p>
      <h1>{s.event.name}</h1>
      <p>
        {s.event.date} · {s.event.location} · {s.event.guests} guests
      </p>
      {s.scenarioNote && (
        <p>
          <strong>Original narrative (before scenario changes):</strong>
        </p>
      )}
      <p>{s.plan.summary}</p>
      {s.scenarioNote && <p>{s.scenarioNote}</p>}
      <h2>Budget · {s.event.currency}</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Basis</th>
          </tr>
        </thead>
        <tbody>
          {s.plan.budget.map((b) => (
            <tr key={b.id}>
              <td>{b.label}</td>
              <td>{money(b.amountMinor, s.event.currency)}</td>
              <td>{b.basis}</td>
            </tr>
          ))}
          <tr>
            <td>Contingency</td>
            <td>{money(totals.contingency, s.event.currency)}</td>
            <td>Reserve</td>
          </tr>
          <tr>
            <td>Remaining</td>
            <td>{money(totals.remaining, s.event.currency)}</td>
            <td>{totals.overBudget ? "OVER BUDGET" : "Within budget"}</td>
          </tr>
        </tbody>
      </table>
      <h2>Preparation timeline</h2>
      <ul>
        {orderTasks(s.plan.tasks).map((t) => (
          <li key={t.id}>
            {t.completed ? "[Done]" : "[Open]"}{" "}
            {addDays(s.event.date, -t.daysBefore)} — {t.title}
          </li>
        ))}
      </ul>
      <h2>Vendors</h2>
      <ul>
        {s.plan.vendors.map((v) => (
          <li key={v.id}>
            {v.category}: {v.name || "Not chosen"} · {v.status} ·{" "}
            {v.contact || "No contact recorded"} ·{" "}
            {v.quotationMinor === null
              ? "No quote"
              : money(v.quotationMinor, s.event.currency)}
          </li>
        ))}
      </ul>
      <h2>Risks</h2>
      <ul>
        {s.plan.risks.map((r) => (
          <li key={r.id}>
            {r.resolved ? "[Resolved]" : "[Open]"} {r.title}. {r.mitigation}
          </li>
        ))}
      </ul>
      <h2>Assumptions & missing information</h2>
      <ul>
        {[...s.plan.assumptions, ...s.plan.missingInfo].map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
      <p>
        Estimates require local verification. This summary is not a booking
        confirmation or feasibility guarantee.
      </p>
    </article>
  );
}
