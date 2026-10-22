import "server-only";
import { z } from "zod";

export const itemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive().max(10000),
  description: z.string().trim().min(1).max(1000),
});

export const submissionInputSchema = z.object({
  categoryId: z.uuid(),
  purpose: z.string().trim().min(1).max(2000),
  items: z.array(itemSchema).min(1).max(100),
});

export const updateSubmissionSchema = submissionInputSchema.omit({ categoryId: true });

export const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION", "CONSIDERATION", "SKIP"]),
  note: z.string().trim().max(2000).optional(),
});

export const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum([
    "DRAFT",
    "WAITING_UNIT_MANAGER",
    "WAITING_CONSIDERATION",
    "WAITING_APPROVAL",
    "WAITING_FINANCE",
    "NEEDS_REVISION",
    "APPROVED",
    "REJECTED",
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
