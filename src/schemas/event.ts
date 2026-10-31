import { z } from "zod";
import { isDate, today, addDays } from "../utils/dates";
export const MAX_MINOR = 100_000_000_000;
export const minorSchema = z.number().finite().int().min(0).max(MAX_MINOR);
export const dateSchema = z
  .string()
  .refine(isDate, "Use a real date in YYYY-MM-DD format.")
  .refine(
    (v) => v >= "2000-01-01" && v <= "2100-12-31",
    "Date must be between 2000 and 2100.",
  );
export const currencySchema = z.enum(["INR", "USD", "EUR", "GBP", "JPY"]);
export const eventSchema = z
  .object({
    name: z.string().trim().min(2, "Use at least 2 characters.").max(100),
    type: z.enum(["wedding", "birthday", "anniversary", "community"]),
    date: dateSchema,
    location: z.string().trim().min(2).max(160),
    guests: z.number().finite().int().min(1).max(100000),
    budgetMinor: minorSchema.refine(
      (v) => v > 0,
      "Budget must be greater than zero.",
    ),
    currency: currencySchema,
    contingencyPercent: z.number().finite().int().min(0).max(30),
    style: z.string().trim().max(200),
    cultural: z.string().trim().max(600),
    accessibility: z.string().trim().max(500),
    dietary: z.string().trim().max(500),
    priorities: z
      .array(
        z.enum([
          "food",
          "photography",
          "atmosphere",
          "sustainability",
          "accessibility",
        ]),
      )
      .max(5)
      .refine((v) => new Set(v).size === v.length, "Duplicate priorities."),
  })
  .strict();
export const newEventSchema = eventSchema.refine(
  (v) => v.date >= today() && v.date <= addDays(today(), 3650),
  {
    path: ["date"],
    message: "Choose today or a date within the next 10 years.",
  },
);
export type EventInput = z.infer<typeof eventSchema>;
export type Currency = z.infer<typeof currencySchema>;
