import { useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { vendorSchema, type Snapshot, type Vendor } from "../../schemas/plan";
import {
  amountString,
  money,
  toMinor,
  changeAllocation,
} from "../budget/engine";
import { addDays, prettyDate } from "../../utils/dates";
import { errorMessage } from "../../services/errors";
function VendorCard({
  vendor,
  snapshot,
  update,
}: {
  vendor: Vendor;
  snapshot: Snapshot;
  update: (s: Snapshot) => void;
}) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  return (
    <article className="panel vendor-card">
      <div className="card-heading">
        <span className="eyebrow">
          {vendor.important ? "IMPORTANT CATEGORY" : "RECOMMENDED CATEGORY"}
        </span>
        <span className="pill">
          {vendor.status === "booked" && <Check size={12} />} {vendor.status}
        </span>
      </div>
      <h3>{vendor.category}</h3>
      <p className="muted">
        Booking target ·{" "}
        {prettyDate(addDays(snapshot.event.date, -vendor.daysBefore))}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            const quote = String(f.get("quotation") ?? "");
            const next = vendorSchema.parse({
              ...vendor,
              name: f.get("name"),
              contact: f.get("contact"),
              status: f.get("status"),
              quotationMinor: quote.trim()
                ? toMinor(quote, snapshot.event.currency)
                : null,
              cancellation: f.get("cancellation"),
            });
            if (next.status === "booked" && !next.name.trim())
              throw new Error(
                "Enter a vendor name before marking this category booked.",
              );
            update({
              ...snapshot,
              plan: {
                ...snapshot.plan,
                vendors: snapshot.plan.vendors.map((v) =>
                  v.id === vendor.id ? next : v,
                ),
              },
            });
            setError("");
            setNotice(
              "Vendor details updated in this plan. Save the plan to persist them.",
            );
          } catch (err) {
            setError(errorMessage(err));
          }
        }}
      >
        <div className="form-grid">
          <div className="field wide">
            <label htmlFor={`name-${vendor.id}`}>Vendor name</label>
            <input
              id={`name-${vendor.id}`}
              name="name"
              defaultValue={vendor.name}
              maxLength={100}
              placeholder="Enter a real vendor you’ve contacted"
            />
          </div>
          <div className="field wide">
            <label htmlFor={`contact-${vendor.id}`}>Contact details</label>
            <input
              id={`contact-${vendor.id}`}
              name="contact"
              defaultValue={vendor.contact}
              maxLength={200}
              placeholder="Email or phone (provided by you)"
            />
          </div>
          <div className="field">
            <label htmlFor={`quote-${vendor.id}`}>
              Quotation ({snapshot.event.currency})
            </label>
            <input
              id={`quote-${vendor.id}`}
              name="quotation"
              inputMode="decimal"
              defaultValue={
                vendor.quotationMinor === null
                  ? ""
                  : amountString(vendor.quotationMinor, snapshot.event.currency)
              }
            />
          </div>
          <div className="field">
            <label htmlFor={`status-${vendor.id}`}>Booking status</label>
            <select
              id={`status-${vendor.id}`}
              name="status"
              defaultValue={vendor.status}
            >
              {["researching", "contacted", "booked", "cancelled"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="field wide">
            <label htmlFor={`cancel-${vendor.id}`}>
              Cancellation policy notes
            </label>
            <textarea
              id={`cancel-${vendor.id}`}
              name="cancellation"
              defaultValue={vendor.cancellation}
              maxLength={600}
              rows={2}
            />
          </div>
        </div>
        <button className="button small secondary">
          Update vendor
          <ArrowUpRight size={14} />
        </button>
      </form>
      {notice && (
        <p className="muted" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <details>
        <summary>Questions worth asking</summary>
        <ul>
          {vendor.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </details>
      {vendor.quotationMinor !== null && (
        <div className="quote-action">
          <p>
            Your quotation:{" "}
            <strong>
              {money(vendor.quotationMinor, snapshot.event.currency)}
            </strong>
          </p>
          <button
            className="text-button"
            onClick={() => {
              if (vendor.quotationMinor !== null) {
                update({
                  ...snapshot,
                  plan: {
                    ...snapshot.plan,
                    budget: changeAllocation(
                      snapshot.plan.budget,
                      vendor.budgetItemId,
                      vendor.quotationMinor,
                      "quote",
                    ),
                  },
                });
                setNotice(
                  "Quotation applied to its budget category. Review the total budget.",
                );
              }
            }}
          >
            Replace linked budget allocation with quote{" "}
            <ArrowUpRight size={14} />
          </button>
          <small>
            Replaces the full category allocation; include every related fee
            first.
          </small>
        </div>
      )}
    </article>
  );
}
export default function VendorPanel({
  snapshot,
  update,
}: {
  snapshot: Snapshot;
  update: (s: Snapshot) => void;
}) {
  return (
    <section>
      <div className="section-heading">
        <span className="eyebrow">THE PEOPLE WHO BRING IT TO LIFE</span>
        <h2>A considered little black book.</h2>
        <p>
          Categories and questions are suggestions. Names, contact details,
          booking status and quotations come only from you.
        </p>
      </div>
      <div className="vendor-grid">
        {snapshot.plan.vendors.map((v) => (
          <VendorCard
            key={v.id}
            vendor={v}
            snapshot={snapshot}
            update={update}
          />
        ))}
      </div>
      {snapshot.plan.vendors.length === 0 && (
        <p className="panel">
          No vendor categories are recommended for this plan.
        </p>
      )}
    </section>
  );
}
