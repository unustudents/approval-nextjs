import { Suspense } from "react";
import { DashboardLoading } from "./_components/DashboardLoading";
import { DashboardOverview } from "./_components/DashboardOverview";
import { getDashboardPageData } from "./_lib/queries";

export default function DashboardPage() {
  return <Suspense fallback={<DashboardLoading />}><DashboardPageContent /></Suspense>;
}

async function DashboardPageContent() {
  const dashboard = await getDashboardPageData();
  return <DashboardOverview {...dashboard} />;
}
