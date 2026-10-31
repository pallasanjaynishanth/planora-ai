import { useState } from "react";
import { ZodError } from "zod";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { newEventSchema, type EventInput } from "../../schemas/event";
import { amountString, toMinor } from "../budget/engine";
import { addDays, today } from "../../utils/dates";
import { Field } from "../../components/Field";
export function exampleEvent(): EventInput {
  return {
    name: "The garden gathering",
    type: "anniversary",
    date: addDays(today(), 120),
    location: "Hyderabad, India",
    guests: 80,
    budgetMinor: 24000000,
    currency: "INR",
    contingencyPercent: 10,
    style: "An intimate garden celebration",
    cultural: "",
    accessibility: "Step-free access and a quiet seating area",
    dietary: "Confirm dietary preferences with guests",
    priorities: ["food", "atmosphere"],
  };
}
export function EventForm({
  initial,
  onSubmit,
  busy = false,
  scenario = false,
}: {
  initial?: EventInput;
  onSubmit: (event: EventInput) => void;
  busy?: boolean;
  scenario?: boolean;
}) {
  const event = initial ?? {
    ...exampleEvent(),
    name: "",
    location: "",
    style: "",
    accessibility: "",
    dietary: "",
  };
  const [errors, setErrors] = useState<Record<string, string>>({});
  const props = (name: string) => ({
    id: name,
    name,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  function submit(form: HTMLFormElement) {
    const f = new FormData(form);
    const value = (key: string) => String(f.get(key) ?? "");
    try {
      const currency = scenario ? event.currency : value("currency");
      const parsed = newEventSchema.safeParse({
        name: value("name"),
        type: value("type"),
        date: value("date"),
        location: value("location"),
        guests: Number(value("guests")),
        budgetMinor: 1,
        currency,
        contingencyPercent: Number(value("contingencyPercent")),
        style: value("style"),
        cultural: value("cultural"),
        accessibility: value("accessibility"),
        dietary: value("dietary"),
        priorities: f.getAll("priorities"),
      });
      if (!parsed.success) throw parsed.error;
      let budgetMinor: number;
      try {
        budgetMinor = toMinor(value("budget"), parsed.data.currency);
      } catch {
        setErrors({
          budget:
            "Enter a valid, nonnegative amount within the supported limit.",
        });
        form.querySelector<HTMLInputElement>("#budget")?.focus();
        return;
      }
      if (budgetMinor === 0) {
        setErrors({ budget: "Budget must be greater than zero." });
        form.querySelector<HTMLInputElement>("#budget")?.focus();
        return;
      }
      setErrors({});
      onSubmit(newEventSchema.parse({ ...parsed.data, budgetMinor }));
    } catch (error) {
      if (error instanceof ZodError) {
        const next: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const field = String(issue.path[0] ?? "form");
          next[field] ??= issue.message;
        });
        setErrors(next);
        const first = Object.keys(next)[0];
        if (first)
          form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      } else
        setErrors({
          form: "Unable to validate these details. Review your entries.",
        });
    }
  }
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      className="event-form"
    >
      <fieldset disabled={busy}>
        <legend className="sr-only">Event details</legend>
        <div className="section-heading">
          <span className="eyebrow">01 / THE OCCASION</span>
          <h2>
            {scenario
              ? "A different possibility."
              : "Every good gathering starts with an idea."}
          </h2>
          <p>
            {scenario
              ? "We’ll compare the changes before you decide. Existing costs stay in place."
              : "Tell us a little about yours. Leave the details you haven’t decided yet blank."}
          </p>
        </div>
        <fieldset className="event-types">
          <legend>What are we celebrating?</legend>
          {(["wedding", "birthday", "anniversary", "community"] as const).map(
            (type, i) => (
              <label key={type}>
                <input
                  type="radio"
                  name="type"
                  value={type}
                  defaultChecked={event.type === type}
                />
                <span className="type-number">0{i + 1}</span>
                <span>{type === "community" ? "Community event" : type}</span>
              </label>
            ),
          )}
        </fieldset>
        <div className="form-grid">
          <Field label="Event name" id="name" error={errors.name} wide>
            <input
              {...props("name")}
              defaultValue={event.name}
              placeholder="e.g. Our summer celebration"
              maxLength={100}
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Event date" id="date" error={errors.date}>
            <input
              {...props("date")}
              type="date"
              defaultValue={event.date}
              min={today()}
              max={addDays(today(), 3650)}
              required
            />
          </Field>
          <Field
            label="Location or venue"
            id="location"
            error={errors.location}
          >
            <input
              {...props("location")}
              defaultValue={event.location}
              placeholder="City, region or venue"
              maxLength={160}
              required
            />
          </Field>
          <Field label="Number of guests" id="guests" error={errors.guests}>
            <input
              {...props("guests")}
              type="number"
              min="1"
              max="100000"
              step="1"
              defaultValue={event.guests}
              required
            />
          </Field>
          <Field label="Currency" id="currency" error={errors.currency}>
            <select
              {...props("currency")}
              defaultValue={event.currency}
              disabled={scenario}
            >
              {["INR", "USD", "EUR", "GBP", "JPY"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Total budget"
            id="budget"
            error={errors.budget}
            hint="Includes your contingency reserve. Taxes must be included in vendor quotes."
          >
            <input
              {...props("budget")}
              inputMode="decimal"
              defaultValue={amountString(event.budgetMinor, event.currency)}
              required
            />
          </Field>
          <Field
            label="Contingency reserve (%)"
            id="contingencyPercent"
            error={errors.contingencyPercent}
            hint="0–30% of your total budget, reserved separately."
          >
            <input
              {...props("contingencyPercent")}
              type="number"
              min="0"
              max="30"
              step="1"
              defaultValue={event.contingencyPercent}
            />
          </Field>
        </div>
        <div className="section-heading compact">
          <span className="eyebrow">02 / MAKE IT YOURS</span>
          <h3>The feeling, the people, the little things.</h3>
        </div>
        <div className="form-grid">
          <Field label="Style or theme" id="style" error={errors.style} wide>
            <input
              {...props("style")}
              defaultValue={event.style}
              maxLength={200}
              placeholder="e.g. Candlelit, relaxed, seasonal greens"
            />
          </Field>
          <Field
            label="Cultural preferences"
            id="cultural"
            error={errors.cultural}
            wide
          >
            <textarea
              {...props("cultural")}
              defaultValue={event.cultural}
              maxLength={600}
              placeholder="Traditions to include or avoid. We won’t assume."
              rows={2}
            />
          </Field>
          <Field
            label="Accessibility requirements"
            id="accessibility"
            error={errors.accessibility}
          >
            <textarea
              {...props("accessibility")}
              defaultValue={event.accessibility}
              maxLength={500}
              placeholder="Access routes, quiet spaces, interpretation…"
              rows={3}
            />
          </Field>
          <Field
            label="Dietary considerations"
            id="dietary"
            error={errors.dietary}
          >
            <textarea
              {...props("dietary")}
              defaultValue={event.dietary}
              maxLength={500}
              placeholder="Preferences and accommodations; avoid personal medical details."
              rows={3}
            />
          </Field>
        </div>
        <fieldset className="priorities">
          <legend>What matters most?</legend>
          {(
            [
              "food",
              "photography",
              "atmosphere",
              "sustainability",
              "accessibility",
            ] as const
          ).map((p) => (
            <label key={p}>
              <input
                type="checkbox"
                name="priorities"
                value={p}
                defaultChecked={event.priorities.includes(p)}
              />
              <span>{p}</span>
            </label>
          ))}
        </fieldset>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="error">
            Please review the highlighted fields. {errors.form}
          </p>
        )}
        <div className="form-footer">
          <p>
            <Sparkles size={16} />{" "}
            {scenario
              ? "You’re in control. Nothing changes until you approve."
              : "In Firebase mode, event details are sent to Gemini. Avoid sensitive personal information."}
          </p>
          <button className="button primary" type="submit" disabled={busy}>
            {busy
              ? "Working on the details…"
              : scenario
                ? "Compare this scenario"
                : "Create my plan"}
            <ArrowUpRight size={18} />
          </button>
        </div>
      </fieldset>
    </form>
  );
}
