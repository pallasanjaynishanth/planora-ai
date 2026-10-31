import { useState } from "react";
import type { Snapshot, BudgetItem } from "../../schemas/plan";
import {
  budgetTotals,
  money,
  amountString,
  toMinor,
  changeAllocation,
} from "./engine";
import { errorMessage } from "../../services/errors";
function BudgetRow({
  item,
  snapshot,
  update,
}: {
  item: BudgetItem;
  snapshot: Snapshot;
  update: (s: Snapshot) => void;
}) {
  const [error, setError] = useState("");
  return (
    <form
      className="budget-row"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const basis = String(f.get("basis"));
          if (
            basis !== "estimate" &&
            basis !== "quote" &&
            basis !== "confirmed"
          )
            throw new Error("Invalid cost basis.");
          const budget = changeAllocation(
            snapshot.plan.budget,
            item.id,
            toMinor(String(f.get("amount")), snapshot.event.currency),
            basis,
          );
          update({ ...snapshot, plan: { ...snapshot.plan, budget } });
          setError("");
        } catch (err) {
          setError(errorMessage(err));
        }
      }}
    >
      <div>
        <strong>{item.label}</strong>
        <p>{item.assumption}</p>
      </div>
      <div className="budget-input">
        <label htmlFor={`amount-${item.id}`}>
          Amount ({snapshot.event.currency})
        </label>
        <input
          id={`amount-${item.id}`}
          name="amount"
          inputMode="decimal"
          defaultValue={amountString(item.amountMinor, snapshot.event.currency)}
          required
        />
      </div>
      <div>
        <label htmlFor={`basis-${item.id}`}>Cost basis</label>
        <select id={`basis-${item.id}`} name="basis" defaultValue={item.basis}>
          <option value="estimate">Estimate</option>
          <option value="quote">User quotation</option>
          <option value="confirmed">Confirmed cost</option>
        </select>
      </div>
      <button
        className="button small secondary"
        type="submit"
        aria-label={`Update ${item.label}`}
      >
        Update
      </button>
      {error && (
        <p className="error wide" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
export default function BudgetPanel({
  snapshot,
  update,
}: {
  snapshot: Snapshot;
  update: (s: Snapshot) => void;
}) {
  const { event, plan } = snapshot;
  const b = budgetTotals(
    plan.budget,
    event.budgetMinor,
    event.guests,
    event.contingencyPercent,
  );
  return (
    <section>
      <div className="section-heading">
        <span className="eyebrow">THE NUMBERS, CLEARLY</span>
        <h2>A little room for the unexpected.</h2>
        <p>
          All amounts are in {event.currency}. A balanced allocation is not
          proof of real-world affordability.
        </p>
      </div>
      <div className="stats-grid">
        <div>
          <small>Total budget</small>
          <strong>{money(event.budgetMinor, event.currency)}</strong>
        </div>
        <div>
          <small>Allocated + reserve</small>
          <strong>{money(b.planned, event.currency)}</strong>
        </div>
        <div className={b.overBudget ? "danger-surface" : ""}>
          <small>{b.overBudget ? "Over budget" : "Remaining"}</small>
          <strong data-testid="remaining-budget">
            {money(Math.abs(b.remaining), event.currency)}
          </strong>
        </div>
        <div>
          <small>Planned per guest</small>
          <strong>{money(b.costPerGuest, event.currency)}</strong>
        </div>
      </div>
      {b.overBudget && (
        <p className="error" role="alert">
          Over budget by {money(-b.remaining, event.currency)}. Review costs or
          the total budget; this plan is not financially ready.
        </p>
      )}
      <div className="panel budget-table">
        {plan.budget.map((item) => (
          <BudgetRow
            key={`${item.id}-${item.amountMinor}-${item.basis}`}
            item={item}
            snapshot={snapshot}
            update={update}
          />
        ))}
        <div className="reserve-row">
          <div>
            <strong>Contingency reserve · {event.contingencyPercent}%</strong>
            <p>
              Calculated from your total budget. Change the reserve in What-if.
            </p>
          </div>
          <strong>{money(b.contingency, event.currency)}</strong>
        </div>
        <div className="reserve-row total">
          <strong>Planned total</strong>
          <strong>{money(b.planned, event.currency)}</strong>
        </div>
      </div>
      <p className="muted">
        Quotations: {money(b.quoted, event.currency)} · Confirmed costs:{" "}
        {money(b.confirmed, event.currency)}. A vendor quotation only changes
        this budget when you explicitly apply it.
      </p>
    </section>
  );
}
