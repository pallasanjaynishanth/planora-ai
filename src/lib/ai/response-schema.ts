import { Schema } from "firebase/ai";
const str = () => Schema.string();
const strings = (maxItems = 12) => Schema.array({ items: str(), maxItems });
const priority = () => Schema.enumString({ enum: ["high", "medium", "low"] });
export const planResponseSchema = Schema.object({
  properties: {
    summary: str(),
    ideas: strings(),
    budget: Schema.array({
      maxItems: 20,
      items: Schema.object({
        properties: {
          id: str(),
          label: str(),
          amountMinor: Schema.integer(),
          assumption: str(),
        },
      }),
    }),
    tasks: Schema.array({
      maxItems: 80,
      items: Schema.object({
        properties: {
          id: str(),
          title: str(),
          daysBefore: Schema.integer(),
          priority: priority(),
          required: Schema.boolean(),
          dependencies: strings(20),
        },
      }),
    }),
    vendors: Schema.array({
      maxItems: 20,
      items: Schema.object({
        properties: {
          id: str(),
          category: str(),
          budgetItemId: str(),
          daysBefore: Schema.integer(),
          important: Schema.boolean(),
          questions: strings(),
        },
      }),
    }),
    risks: Schema.array({
      maxItems: 20,
      items: Schema.object({
        properties: {
          id: str(),
          title: str(),
          severity: priority(),
          mitigation: str(),
        },
      }),
    }),
    assumptions: strings(),
    missingInfo: strings(),
    alternatives: strings(),
  },
});
export const alternativeResponseSchema = Schema.object({
  properties: { alternatives: strings(8), assumptions: strings(8) },
});
