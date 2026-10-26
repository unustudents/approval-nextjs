import type { Role } from "@/generated/prisma/client";

export type WorkflowStepItem = {
  type: "APPROVAL" | "CONSIDERATION";
  targetType: "UNIT_MANAGER" | "ROLE" | "USER";
  targetRole?: Role | null;
  targetUserId?: string | null;
  required: boolean;
  allowRevision: boolean;
};

export type WorkflowCategory = {
  id: string;
  name: string;
  status: string;
  workflow: {
    id: string;
    name: string;
    status: string;
    steps: Array<{
      id: string;
      order: number;
      type: "APPROVAL" | "CONSIDERATION";
      targetType: "UNIT_MANAGER" | "ROLE" | "USER";
      targetRole: Role | null;
      targetUser: { id: string; name: string } | null;
      required: boolean;
      allowRevision: boolean;
    }>;
  } | null;
};

export type WorkflowUser = {
  id: string;
  name: string;
  username: string;
  roles: Array<{ role: Role }>;
};

export type WorkflowActionResult = { ok: true } | { ok: false; message: string };
