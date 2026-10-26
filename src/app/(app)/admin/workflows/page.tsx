import { Suspense } from "react";
import { WorkflowsLoading } from "./_components/WorkflowsLoading";
import { WorkflowsManagement } from "./_components/WorkflowsManagement";
import { getWorkflowsPageData } from "./_lib/queries";

type WorkflowsPageProps = {
  searchParams: Promise<{ categoryId?: string | string[] }>;
};

export default async function AdminWorkflowsPage({ searchParams }: WorkflowsPageProps) {
  const categoryId = (await searchParams).categoryId;

  return (
    <Suspense fallback={<WorkflowsLoading />}>
      <WorkflowsPageContent initialCategoryId={typeof categoryId === "string" ? categoryId : undefined} />
    </Suspense>
  );
}

async function WorkflowsPageContent({ initialCategoryId }: { initialCategoryId?: string }) {
  const { categories, users } = await getWorkflowsPageData();
  return <WorkflowsManagement categories={categories} users={users} initialCategoryId={initialCategoryId} />;
}
