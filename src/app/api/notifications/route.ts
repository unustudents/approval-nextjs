import { handleApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  return handleApi(async () => {
    const user = await requireSession();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 25) || 25));
    const [total, unreadCount, data] = await prisma.$transaction([
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
      prisma.notification.findMany({
        where: { userId: user.id },
        select: { id: true, submissionId: true, type: true, message: true, readAt: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { data, unreadCount, pagination: { page, pageSize, total } };
  });
}
