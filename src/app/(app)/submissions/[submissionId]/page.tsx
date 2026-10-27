import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSubmission } from "@/app/api/submissions/_lib/submission-service";
import { listManagedUnits } from "@/app/api/submissions/_lib/submission-service";
import { requireSession } from "@/lib/session";
import SubmissionDetailClient, { type SubmissionDetail } from "./_components/SubmissionDetailClient";

export default function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  return <Suspense fallback={<SubmissionDetailLoading />}><SubmissionDetailPageContent params={params} searchParams={searchParams} /></Suspense>;
}

async function SubmissionDetailPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [user, { submissionId }, { edit }] = await Promise.all([requireSession(), params, searchParams]);
  const [submission, categories, managedUnits] = await Promise.all([
    getSubmission(user, submissionId),
    prisma.category.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    user.roles.includes("UNIT_MANAGER") ? listManagedUnits(user) : Promise.resolve([]),
  ]);
  const initialSubmission = JSON.parse(JSON.stringify(submission)) as SubmissionDetail;

  return <SubmissionDetailClient initialSubmission={initialSubmission} user={user} initialEditMode={edit === "1"} categories={categories} managedUnits={managedUnits} />;
}

function SubmissionDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2"><div className="h-6 w-64 rounded bg-slate-200" /><div className="h-4 w-full max-w-xl rounded bg-slate-100" /></div>
      <div className="h-72 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
