import "server-only";
import { prisma } from "@/lib/prisma";

export async function getApprovalStats() {
  const [pending, approved, rejected, durations] = await Promise.all([
    prisma.submission.count({ where: { status: { in: ["WAITING_UNIT_MANAGER", "WAITING_FINANCE", "NEEDS_REVISION"] } } }),
    prisma.submission.count({ where: { status: "APPROVED" } }),
    prisma.submission.count({ where: { status: "REJECTED" } }),
    prisma.$queryRaw<Array<{ averageMilliseconds: number | null }>>`
      SELECT CAST(AVG(TIMESTAMPDIFF(MICROSECOND, \`submittedAt\`, \`decidedAt\`) / 1000) AS DOUBLE) AS \`averageMilliseconds\`
      FROM \`Submission\`
      WHERE \`submittedAt\` IS NOT NULL AND \`decidedAt\` IS NOT NULL
    `,
  ]);

  return {
    pending,
    approved,
    rejected,
    averageApprovalMilliseconds: durations[0]?.averageMilliseconds ?? null,
  };
}
