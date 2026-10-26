import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "./_components/AppShell";
import { getSession } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Suspense>
  );
}

async function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  return <AppShell initialUser={user}>{children}</AppShell>;
}
