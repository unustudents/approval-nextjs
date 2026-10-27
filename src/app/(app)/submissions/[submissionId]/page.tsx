import { Suspense } from "react";
import { getSubmission } from "@/app/api/submissions/_lib/submission-service";
import { requireSession } from "@/lib/session";
import SubmissionDetailClient, { type SubmissionDetail } from "./_components/SubmissionDetailClient";

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  return <Suspense fallback={<SubmissionDetailLoading />}><SubmissionDetailPageContent params={params} /></Suspense>;
}

async function SubmissionDetailPageContent({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const [user, { submissionId }] = await Promise.all([requireSession(), params]);
  const submission = await getSubmission(user, submissionId);
  const initialSubmission = JSON.parse(JSON.stringify(submission)) as SubmissionDetail;

  return <SubmissionDetailClient initialSubmission={initialSubmission} user={user} />;
}

function SubmissionDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2"><div className="h-6 w-64 rounded bg-slate-200" /><div className="h-4 w-full max-w-xl rounded bg-slate-100" /></div>
      <div className="h-72 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
