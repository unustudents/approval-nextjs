import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";

type StatRow = {
  pending: number;
  approved: number;
  rejected: number;
  averageApprovalMilliseconds: number | null;
};

function getScopeClause(user: SessionUser) {
  if (
    user.roles.includes("FINANCE_APPROVER") ||
    user.roles.includes("GENERAL_AFFAIRS") ||
    user.roles.includes("SUPERADMIN")
  ) {
    return Prisma.empty;
  }

  if (user.roles.includes("UNIT_MANAGER")) {
    return Prisma.sql`
      AND \`unitId\` IN (
        SELECT \`id\` FROM \`Unit\` WHERE \`managerId\` = ${user.id}
      )
    `;
  }

  return Prisma.sql`AND \`requesterId\` = ${user.id}`;
}

export async function getApprovalStats(user: SessionUser) {
  const scopeClause = getScopeClause(user);
  const [stats] = await prisma.$queryRaw<StatRow[]>`
    SELECT
      CAST(COALESCE(SUM(CASE WHEN \`status\` IN ('WAITING_UNIT_MANAGER', 'WAITING_FINANCE', 'NEEDS_REVISION') THEN 1 ELSE 0 END), 0) AS DOUBLE) AS \`pending\`,
      CAST(COALESCE(SUM(CASE WHEN \`status\` = 'APPROVED' THEN 1 ELSE 0 END), 0) AS DOUBLE) AS \`approved\`,
      CAST(COALESCE(SUM(CASE WHEN \`status\` = 'REJECTED' THEN 1 ELSE 0 END), 0) AS DOUBLE) AS \`rejected\`,
      CAST(AVG(CASE
        WHEN \`submittedAt\` IS NOT NULL AND \`decidedAt\` IS NOT NULL
        THEN TIMESTAMPDIFF(MICROSECOND, \`submittedAt\`, \`decidedAt\`) / 1000
      END) AS DOUBLE) AS \`averageApprovalMilliseconds\`
    FROM \`Submission\`
    WHERE 1 = 1 ${scopeClause}
  `;

  return {
    pending: stats?.pending ?? 0,
    approved: stats?.approved ?? 0,
    rejected: stats?.rejected ?? 0,
    averageApprovalMilliseconds: stats?.averageApprovalMilliseconds ?? null,
  };
}
