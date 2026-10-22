import { handleApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  return handleApi(async () => {
    const user = await requireSession();
    const submissions = await prisma.submission.findMany({
      where: {
        status: { in: ["WAITING_UNIT_MANAGER", "WAITING_CONSIDERATION", "WAITING_APPROVAL", "WAITING_FINANCE"] },
        currentStep: {
          status: "PENDING",
          OR: [
            { targetUserId: user.id },
            { targetType: "ROLE", targetRole: user.role },
          ],
        },
      },
      include: {
        requester: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        currentStep: { select: { id: true, order: true, type: true, allowRevision: true } },
      },
      orderBy: { submittedAt: "asc" },
    });

    return submissions;
  });
}
