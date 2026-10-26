import "server-only";
import { conflict, notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { WorkflowStepItem } from "./model";

export async function listWorkflows() {
  return prisma.category.findMany({
    select: {
      id: true, name: true, status: true,
      workflow: {
        select: {
          id: true, name: true, status: true,
          steps: {
            orderBy: { order: "asc" },
            select: {
              id: true, order: true, type: true, targetType: true, targetRole: true,
              targetUser: { select: { id: true, name: true } }, required: true, allowRevision: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function replaceWorkflow(categoryId: string, input: { name: string; steps: WorkflowStepItem[] }) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, status: "ACTIVE" }, select: { id: true } });
  if (!category) throw notFound();

  const roleTargets = new Set(input.steps.flatMap((step) => step.targetType === "ROLE" && step.targetRole ? [step.targetRole] : []));
  for (const role of roleTargets) {
    const count = await prisma.user.count({ where: { roles: { some: { role } }, status: "ACTIVE" } });
    if (count === 0) throw conflict(`Belum ada pengguna aktif dengan role ${role}`);
  }

  const userTargets = input.steps.flatMap((step) => step.targetType === "USER" && step.targetUserId ? [step.targetUserId] : []);
  if (userTargets.length) {
    const count = await prisma.user.count({ where: { id: { in: userTargets }, status: "ACTIVE" } });
    if (count !== new Set(userTargets).size) throw conflict("Target workflow harus berupa pengguna aktif");
  }

  return prisma.$transaction(async (tx) => {
    const workflow = await tx.workflow.upsert({
      where: { categoryId },
      update: { name: input.name, status: "ACTIVE" },
      create: { categoryId, name: input.name },
    });
    await tx.workflowStep.deleteMany({ where: { workflowId: workflow.id } });
    await tx.workflowStep.createMany({
      data: input.steps.map((step, index) => ({
        workflowId: workflow.id, order: index + 1, type: step.type, targetType: step.targetType,
        targetRole: step.targetType === "ROLE" ? step.targetRole ?? null : null,
        targetUserId: step.targetType === "USER" ? step.targetUserId ?? null : null,
        required: step.required, allowRevision: step.allowRevision,
      })),
    });
    return tx.workflow.findUniqueOrThrow({ where: { id: workflow.id }, include: { steps: { orderBy: { order: "asc" } } } });
  });
}
