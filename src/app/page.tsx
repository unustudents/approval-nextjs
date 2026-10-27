import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default function IndexPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-xs text-slate-500">Mengalihkan ke Portal Layanan...</div>}>
      <RedirectToLanding />
    </Suspense>
  );
}

async function RedirectToLanding() {
  const user = await getSession();
  redirect(user ? "/portal" : "/login");
  return null;
}
