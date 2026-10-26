import { Suspense } from "react";
import { UnitsLoading } from "./_components/UnitsLoading";
import { UnitsManagement } from "./_components/UnitsManagement";
import { getUnitsPageData } from "./_lib/queries";

export default function AdminUnitsPage() {
  return (
    <Suspense fallback={<UnitsLoading />}>
      <UnitsPageContent />
    </Suspense>
  );
}

async function UnitsPageContent() {
  const { units, managers } = await getUnitsPageData();
  return <UnitsManagement units={units} managers={managers} />;
}
