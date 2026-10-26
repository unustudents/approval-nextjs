import "server-only";
import { z } from "zod";

export const createUnitSchema = z.object({
  name: z.string().trim().min(2).max(120),
  managerId: z.uuid().nullable().optional(),
});

export const updateUnitSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    managerId: z.uuid().nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Setidaknya satu field harus diubah");
