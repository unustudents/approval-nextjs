import "server-only";
import { z } from "zod";

const stepSchema = z.object({
  type: z.enum(["APPROVAL", "CONSIDERATION"]),
  targetType: z.enum(["UNIT_MANAGER", "ROLE", "USER"]),
  targetRole: z.enum(["REQUESTER", "UNIT_MANAGER", "CONSIDERATION", "FINANCE_APPROVER", "GENERAL_AFFAIRS", "SUPERADMIN"]).nullable().optional(),
  targetUserId: z.uuid().nullable().optional(),
  required: z.boolean().default(true),
  allowRevision: z.boolean().default(false),
});

export const workflowInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  steps: z.array(stepSchema).min(2).max(20),
}).superRefine(({ steps }, context) => {
  if (steps[0]?.type !== "APPROVAL" || steps[0]?.targetType !== "UNIT_MANAGER") {
    context.addIssue({ code: "custom", path: ["steps", 0], message: "Tahap pertama harus approval Manager Unit" });
  }
  if (steps[0] && !steps[0].required) {
    context.addIssue({ code: "custom", path: ["steps", 0, "required"], message: "Approval Manager Unit wajib dijalankan" });
  }
  if (steps.at(-1)?.type !== "APPROVAL") {
    context.addIssue({ code: "custom", path: ["steps", steps.length - 1], message: "Tahap terakhir harus berupa approval" });
  }
  steps.forEach((step, index) => {
    if (step.targetType === "UNIT_MANAGER" && index !== 0) {
      context.addIssue({ code: "custom", path: ["steps", index], message: "Manager Unit hanya boleh menjadi tahap pertama" });
    }
    if (step.targetType === "ROLE" && !step.targetRole) {
      context.addIssue({ code: "custom", path: ["steps", index, "targetRole"], message: "Role target wajib diisi" });
    }
    if (step.targetType === "USER" && !step.targetUserId) {
      context.addIssue({ code: "custom", path: ["steps", index, "targetUserId"], message: "Pengguna target wajib dipilih" });
    }
    if (step.type === "CONSIDERATION" && step.allowRevision) {
      context.addIssue({ code: "custom", path: ["steps", index, "allowRevision"], message: "Pemberi pertimbangan tidak dapat meminta revisi" });
    }
  });
});
