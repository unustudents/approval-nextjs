import { assertSameOrigin, handleApi } from "@/lib/http";
import { notFound } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

type RouteContext = { params: Promise<{ notificationId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  return handleApi(async () => {
    assertSameOrigin(request);
    const user = await requireSession();
    const { notificationId } = await params;
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count !== 1) {
      const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId: user.id } });
      if (!notification) throw notFound();
    }
    return { id: notificationId, read: true };
  });
}
