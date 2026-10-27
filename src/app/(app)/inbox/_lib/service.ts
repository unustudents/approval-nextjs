import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import type { InboxItem } from "./model";

export async function listInboxTasks(user: SessionUser): Promise<InboxItem[]> {
  const [approvalSubmissions, explanationRequests] = await Promise.all([
    prisma.submission.findMany({
      where: {
        status: { in: ["WAITING_UNIT_MANAGER", "WAITING_FINANCE"] },
        currentStep: {
          status: "PENDING",
          OR: [
            { targetUserId: user.id },
            { targetType: "ROLE", targetRole: { in: user.roles } },
          ],
        },
      },
      include: {
        requester: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        currentStep: { select: { id: true, order: true } },
      },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.explanationRequest.findMany({
      where: { recipientId: user.id, status: "PENDING" },
      include: {
        submission: {
          include: {
            requester: { select: { id: true, name: true } },
            unit: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return [
    ...approvalSubmissions.map((submission) => ({
      ...submission,
      taskType: "APPROVAL" as const,
    })),
    ...explanationRequests.map((request) => ({
      ...request.submission,
      taskType: "EXPLANATION" as const,
      explanationRequestId: request.id,
      currentStep: null,
    })),
  ];
}
