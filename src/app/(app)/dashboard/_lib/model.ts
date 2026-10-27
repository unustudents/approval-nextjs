import type { SubmissionStatus } from "@/components/StatusBadge";

export type DashboardStats = {
  pending: number;
  approved: number;
  rejected: number;
  averageApprovalMilliseconds: number | null;
};

export type SubmissionSummary = {
  id: string;
  number: string;
  status: SubmissionStatus;
  createdAt: Date;
  submittedAt: Date | null;
  requester: { id: string; name: string };
  unit: { id: string; name: string };
  category: { id: string; name: string };
};
