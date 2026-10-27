import { Suspense } from "react";
import { ProfileSettings } from "./_components/ProfileSettings";
import { requireSession } from "@/lib/session";

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfilePageContent />
    </Suspense>
  );
}

async function ProfilePageContent() {
  const user = await requireSession();
  return <ProfileSettings user={{ username: user.username, name: user.name }} />;
}

function ProfileLoading() {
  return (
    <div className="max-w-2xl" aria-busy="true">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Akun Saya</h1>
      <p className="mt-2 text-sm text-slate-600">Memuat informasi akun...</p>
    </div>
  );
}
