"use client";

import Link from "next/link";
import { LayoutGrid, LogOut } from "lucide-react";
import { api } from "@/lib/api-client";
import { roleDisplayName } from "@/components/StatusBadge";
import type { SessionUser } from "@/lib/session";

export function PortalHeader({ user }: { user: SessionUser }) {
  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Title */}
          <Link
            href="/portal"
            className="flex items-center gap-3 font-semibold text-slate-900 tracking-tight"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1E3A5F] flex items-center justify-center text-white shadow-xs">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#1E3A5F] leading-none">
                Portal Layanan Terpadu
              </span>
              <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                Enterprise Operations Platform
              </span>
            </div>
          </Link>

          {/* Right Side: User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-[#1E3A5F]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500">
                  {user.roles.map(roleDisplayName).join(", ")}
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Keluar dari akun"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

