import { handleApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  return handleApi(async () => {
    await requireSession();
    return prisma.category.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  });
}
