import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { listManagedUnits } from "@/app/api/submissions/_lib/submission-service";
import NewSubmissionForm from "./_components/NewSubmissionForm";

export default function NewSubmissionPage() {
  return (
    <Suspense fallback={<NewSubmissionLoading />}>
      <NewSubmissionPageContent />
    </Suspense>
  );
}

async function NewSubmissionPageContent() {
  const user = await requireSession();
  const isManager = user.roles.includes("UNIT_MANAGER");
  const [initialCategories, initialManagedUnits] = await Promise.all([
    prisma.category.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    isManager ? listManagedUnits(user) : Promise.resolve([]),
  ]);

  return (
    <NewSubmissionForm
      isManager={isManager}
      initialCategories={initialCategories}
      initialManagedUnits={initialManagedUnits}
    />
  );
}

function NewSubmissionLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-72 rounded bg-slate-200" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-100" />
      </div>
      <div className="h-96 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
