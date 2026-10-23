"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    api
      .get("/api/auth/session")
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-500">
      Mengalihkan ke Office Approval...
    </div>
  );
}
