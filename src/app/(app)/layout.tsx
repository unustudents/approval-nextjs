"use client";

import { Suspense } from "react";
import { AppShell } from "./_components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
