import type { EventInput } from "../schemas/event";
import type { PlanDraft } from "../schemas/plan";
import { reserveFor } from "../features/budget/engine";
export function demoDraft(event: EventInput): PlanDraft {
  const spendable =
    event.budgetMinor - reserveFor(event.budgetMinor, event.contingencyPercent);
  const categories = [
    ["venue", "Venue & setting", 30],
    ["food", "Food & refreshments", 35],
    ["atmosphere", "Atmosphere & styling", 15],
    ["photography", "Photography", 10],
    ["logistics", "Guest care & logistics", 10],
  ] as const;
  let allocated = 0;
  const budget = categories.map(([id, label, weight], i) => {
    const amountMinor =
      i === categories.length - 1
        ? spendable - allocated
        : Math.floor((spendable * weight) / 100);
    allocated += amountMinor;
    return {
      id,
      label,
      amountMinor,
      assumption:
        "Illustrative allocation only. Obtain itemized local quotations, taxes and cancellation terms.",
    };
  });
  return {
    summary: `A thoughtful ${event.type} for ${event.guests} guests in ${event.location}, shaped around ${event.style || "a welcoming, personal atmosphere"}. This deterministic example demonstrates the workspace; it is not a Gemini response or a market-price assessment.`,
    ideas: [
      "A personal welcome note at each place setting.",
      "A quiet seating area with a clear, step-free route.",
      "Seasonal arrangements that guests can take home.",
    ],
    budget,
    tasks: [
      {
        id: "brief",
        title: "Confirm the event brief and priorities",
        daysBefore: 90,
        priority: "high",
        required: true,
        dependencies: [],
      },
      {
        id: "venue",
        title: "Review and book an accessible venue",
        daysBefore: 60,
        priority: "high",
        required: true,
        dependencies: ["brief"],
      },
      {
        id: "catering",
        title: "Confirm menu, allergens and dietary needs",
        daysBefore: 45,
        priority: "high",
        required: true,
        dependencies: ["venue"],
      },
      {
        id: "invites",
        title: "Send invitations and collect access requests",
        daysBefore: 40,
        priority: "medium",
        required: true,
        dependencies: ["venue"],
      },
      {
        id: "details",
        title: "Finalize styling and the running order",
        daysBefore: 14,
        priority: "medium",
        required: false,
        dependencies: ["venue"],
      },
      {
        id: "confirm",
        title: "Reconfirm guests, vendors and contingency plans",
        daysBefore: 7,
        priority: "high",
        required: true,
        dependencies: ["catering", "invites"],
      },
    ],
    vendors: [
      {
        id: "venue-vendor",
        category: "Venue",
        budgetItemId: "venue",
        daysBefore: 60,
        important: true,
        questions: [
          "Is step-free access available throughout?",
          "What is included, and what is the cancellation policy?",
        ],
      },
      {
        id: "catering-vendor",
        category: "Catering",
        budgetItemId: "food",
        daysBefore: 45,
        important: true,
        questions: [
          "How are allergies and cross-contact managed?",
          "Does the quote include staff, taxes and equipment?",
        ],
      },
      {
        id: "photo-vendor",
        category: "Photography",
        budgetItemId: "photography",
        daysBefore: 30,
        important: false,
        questions: [
          "What is the delivery timeline and usage permission?",
          "What happens if the photographer is unavailable?",
        ],
      },
    ],
    risks: [
      {
        id: "pricing",
        title: "Local pricing is unverified",
        severity: "high",
        mitigation: "Get written itemized quotes before committing funds.",
      },
      {
        id: "weather",
        title: "Venue contingency is unconfirmed",
        severity: "medium",
        mitigation: "Confirm an indoor alternative and transport access.",
      },
    ],
    assumptions: [
      "All amounts are illustrative estimates in the selected currency.",
      "No specific religious or cultural traditions are assumed.",
      "Contingency is reserved separately from category costs.",
    ],
    missingInfo: [
      "Written vendor quotations and availability.",
      "Guest accessibility and dietary requirements still need confirmation.",
    ],
    alternatives: [
      "Reduce styling scope to protect food and guest-care spending.",
      "Consider an off-peak date after checking vendor availability.",
    ],
  };
}
