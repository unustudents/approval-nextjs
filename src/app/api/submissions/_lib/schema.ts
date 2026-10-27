import "server-only";
import { z } from "zod";

export const itemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive().max(10000),
  unitPrice: z.number().finite().positive().max(999_999_999_999.99),
  description: z.string().trim().max(1000).optional().default(""),
  specification: z.string().trim().max(2000).optional().default(""),
});

export const submissionInputSchema = z.object({
  categoryId: z.uuid(),
  unitId: z.uuid().optional(),
  items: z.array(itemSchema).min(1).max(100),
});

export const updateSubmissionSchema = submissionInputSchema.omit({ categoryId: true, unitId: true });

export const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
  note: z.string().trim().max(2000).optional(),
});

export const requestConsiderationSchema = z.object({
  recipientId: z.uuid(),
  message: z.string().trim().min(1).max(2000),
});

export const respondConsiderationSchema = z.object({
  response: z.string().trim().min(1).max(2000),
});

export const requestExplanationSchema = z.object({
  question: z.string().trim().min(1).max(2000),
});

export const answerExplanationSchema = z.object({
  answer: z.string().trim().min(1).max(2000),
});

export const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum([
    "DRAFT",
    "WAITING_UNIT_MANAGER",
    "WAITING_FINANCE",
    "NEEDS_REVISION",
    "APPROVED",
    "REJECTED",
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
