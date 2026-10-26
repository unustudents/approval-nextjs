import "server-only";
import { z } from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9._-]+$/),
  name: z.string().trim().min(2).max(160),
  password: z.string().min(4).max(128),
  roles: z.array(z.enum([
    "REQUESTER",
    "UNIT_MANAGER",
    "CONSIDERATION",
    "FINANCE_APPROVER",
    "GENERAL_AFFAIRS",
    "SUPERADMIN",
  ])).min(1),
  unitId: z.uuid().nullable().optional(),
});

export const updateUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(50)
      .regex(/^[a-z0-9._-]+$/)
      .optional(),
    name: z.string().trim().min(2).max(160).optional(),
    password: z.string().min(4).max(128).optional(),
    roles: z
      .array(z.enum([
        "REQUESTER",
        "UNIT_MANAGER",
        "CONSIDERATION",
        "FINANCE_APPROVER",
        "GENERAL_AFFAIRS",
        "SUPERADMIN",
      ]))
      .min(1)
      .optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    unitId: z.uuid().nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Setidaknya satu field harus diubah",
  );
