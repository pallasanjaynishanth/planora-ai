import { z } from "zod";
import { eventSchema, minorSchema } from "./event";
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const text = z.string().trim().min(1).max(600);
const texts = z.array(text).max(12);
export const budgetDraftSchema = z
  .object({
    id: idSchema,
    label: z.string().min(1).max(80),
    amountMinor: minorSchema,
    assumption: text,
  })
  .strict();
export const taskDraftSchema = z
  .object({
    id: idSchema,
    title: text,
    daysBefore: z.number().int().min(0).max(3650),
    priority: z.enum(["high", "medium", "low"]),
    required: z.boolean(),
    dependencies: z.array(idSchema).max(20),
  })
  .strict();
export const vendorDraftSchema = z
  .object({
    id: idSchema,
    category: z.string().min(1).max(80),
    budgetItemId: idSchema,
    daysBefore: z.number().int().min(0).max(3650),
    important: z.boolean(),
    questions: texts,
  })
  .strict();
export const riskDraftSchema = z
  .object({
    id: idSchema,
    title: text,
    severity: z.enum(["high", "medium", "low"]),
    mitigation: text,
  })
  .strict();
export const draftSchema = z
  .object({
    summary: z.string().min(1).max(1500),
    ideas: texts.min(1),
    budget: z.array(budgetDraftSchema).min(1).max(20),
    tasks: z.array(taskDraftSchema).min(1).max(80),
    vendors: z.array(vendorDraftSchema).max(20),
    risks: z.array(riskDraftSchema).max(20),
    assumptions: texts,
    missingInfo: texts,
    alternatives: texts,
  })
  .strict();
export const budgetItemSchema = budgetDraftSchema.extend({
  basis: z.enum(["estimate", "quote", "confirmed"]),
});
export const taskSchema = taskDraftSchema.extend({ completed: z.boolean() });
export const vendorSchema = vendorDraftSchema.extend({
  name: z.string().max(100),
  contact: z.string().max(200),
  quotationMinor: minorSchema.nullable(),
  status: z.enum(["researching", "contacted", "booked", "cancelled"]),
  cancellation: z.string().max(600),
});
export const planSchema = draftSchema.extend({
  budget: z.array(budgetItemSchema).min(1).max(20),
  tasks: z.array(taskSchema).min(1).max(80),
  vendors: z.array(vendorSchema).max(20),
  risks: z.array(riskDraftSchema.extend({ resolved: z.boolean() })).max(20),
});
export const snapshotSchema = z
  .object({
    event: eventSchema,
    plan: planSchema,
    source: z.enum(["demo", "gemini"]),
    scenarioNote: z.string().max(800),
  })
  .strict();
export const revisionSchema = z
  .object({
    id: idSchema,
    savedAt: z.string().datetime(),
    label: z.string().max(120),
    snapshot: snapshotSchema,
  })
  .strict();
export const workspaceSchema = z
  .object({
    snapshot: snapshotSchema,
    revisions: z.array(revisionSchema).max(30),
  })
  .strict();
export type PlanDraft = z.infer<typeof draftSchema>;
export type Plan = z.infer<typeof planSchema>;
export type BudgetItem = z.infer<typeof budgetItemSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Vendor = z.infer<typeof vendorSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Revision = z.infer<typeof revisionSchema>;
export type TaskDraft = z.infer<typeof taskDraftSchema>;
