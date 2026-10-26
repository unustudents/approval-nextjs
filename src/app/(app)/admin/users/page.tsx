import { Suspense } from "react";
import { UsersLoading } from "./_components/UsersLoading";
import { UsersManagement } from "./_components/UsersManagement";
import { getUsersPageData } from "./_lib/queries";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<UsersLoading />}>
      <UsersPageContent />
    </Suspense>
  );
}

async function UsersPageContent() {
  const { users, units } = await getUsersPageData();
  return <UsersManagement users={users} units={units} />;
}
