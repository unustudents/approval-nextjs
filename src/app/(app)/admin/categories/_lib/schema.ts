import "server-only";
import { z } from "zod";

export const createCategorySchema = z.object({ name: z.string().trim().min(2).max(120) });
export const updateCategorySchema = z.object({ name: z.string().trim().min(2).max(120).optional(), status: z.enum(["ACTIVE", "INACTIVE"]).optional() }).refine((data) => Object.keys(data).length > 0, "Setidaknya satu field harus diubah");
