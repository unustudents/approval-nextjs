import type { SubmissionStatus } from "@/components/StatusBadge";

export type InboxItem = {
  id: string;
  number: string;
  status: SubmissionStatus;
  submittedAt: Date | null;
  requester: { id: string; name: string };
  unit: { id: string; name: string };
  category: { id: string; name: string };
  taskType: "APPROVAL" | "EXPLANATION";
  explanationRequestId?: string;
  currentStep: { id: string; order: number } | null;
};
