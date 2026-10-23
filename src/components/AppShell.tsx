"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Inbox,
  Users,
  Building,
  Tags,
  GitBranch,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { roleDisplayName } from "./StatusBadge";

export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: string;
  unitId: string | null;
};

export const CurrentUserContext = createContext<CurrentUser | null>(null);

export function useCurrentUser(): CurrentUser | null {
  return useContext(CurrentUserContext);
}

interface NotificationItem {
  id: string;
  submissionId: string;
  type: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export function AppShell({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: CurrentUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(initialUser ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const lastNotifFetchRef = useRef<number>(0);

  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    // Jangan fetch ulang session jika user sudah ada di state/context
    if (user || initialUser) return;

    let active = true;

    async function loadSession() {
      try {
        const sessionUser = await api.get<CurrentUser>("/api/auth/session");
        if (active) setUser(sessionUser);
      } catch {
        if (active && pathname !== "/login") {
          router.replace("/login");
        }
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, [initialUser, user, pathname, router]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get<{
        data: NotificationItem[];
        unreadCount: number;
      }>("/api/notifications?pageSize=8");
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
      lastNotifFetchRef.current = Date.now();
    } catch {
      // silent fail for non-blocking notifications
    }
  }, []);

  // 1. Otomatis cek notifikasi setiap kali user berpindah menu/halaman (throttled 10 detik)
  // Memastikan badge merah langsung muncul saat user aktif bernavigasi tanpa harus klik lonceng
  useEffect(() => {
    if (!user) return;
    if (Date.now() - lastNotifFetchRef.current > 10_000) {
      loadNotifications();
    }
  }, [pathname, user, loadNotifications]);

  // 2. Smart Heartbeat: Polling otomatis HANYA saat tab aktif di layar dan user tidak idle
  // Jika tab di-minimize, pindah tab lain, atau ditinggal (idle > 5 menit), polling otomatis berhenti total
  // sehingga Neon DB tetap bisa auto-suspend untuk menghemat kuota free tier
  useEffect(() => {
    if (!user) return;

    let timer: NodeJS.Timeout | null = null;
    let isUserActive = true;
    let idleTimer: NodeJS.Timeout | null = null;

    function resetIdleTimer() {
      isUserActive = true;
      if (idleTimer) clearTimeout(idleTimer);
      // Timeout idle setelah 5 menit tanpa pergerakan mouse/keyboard
      idleTimer = setTimeout(() => {
        isUserActive = false;
      }, 300_000);
    }

    function checkNotifications() {
      if (document.visibilityState === "visible" && isUserActive) {
        loadNotifications();
      }
    }

    // Polling setiap 45 detik selama user aktif di layar
    timer = setInterval(checkNotifications, 45_000);

    function handleActiveEvent() {
      resetIdleTimer();
      if (document.visibilityState === "visible") {
        if (Date.now() - lastNotifFetchRef.current > 15_000) {
          loadNotifications();
        }
      }
    }

    resetIdleTimer();
    window.addEventListener("visibilitychange", handleActiveEvent);
    window.addEventListener("focus", handleActiveEvent);
    window.addEventListener("mousemove", resetIdleTimer, { passive: true });
    window.addEventListener("keydown", resetIdleTimer, { passive: true });

    return () => {
      if (timer) clearInterval(timer);
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("visibilitychange", handleActiveEvent);
      window.removeEventListener("focus", handleActiveEvent);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
    };
  }, [user, loadNotifications]);

  function handleToggleNotifications() {
    setNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        loadNotifications();
      }
      return next;
    });
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  }

  async function handleNotificationClick(notif: NotificationItem) {
    if (!notif.readAt) {
      try {
        await api.patch(`/api/notifications/${notif.id}`, {});
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // ignore
      }
    }
    setNotificationsOpen(false);
    router.push(`/submissions/${notif.submissionId}`);
  }

  const isSuperadmin = user?.role === "SUPERADMIN";
  const isRequester = user?.role === "REQUESTER" || isSuperadmin;
  const isApprover =
    user?.role === "UNIT_MANAGER" ||
    user?.role === "CONSIDERATION" ||
    user?.role === "FINANCE_APPROVER" ||
    isSuperadmin;

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Daftar Pengajuan",
      href: "/submissions",
      icon: FileText,
      show: true,
    },
    {
      name: "Buat Pengajuan",
      href: "/submissions/new",
      icon: PlusCircle,
      show: isRequester,
    },
    {
      name: "Inbox Approval",
      href: "/inbox",
      icon: Inbox,
      show: isApprover,
    },
  ];

  const adminNavigation = [
    { name: "Pengguna", href: "/admin/users", icon: Users },
    { name: "Unit Kerja", href: "/admin/units", icon: Building },
    { name: "Kategori Barang", href: "/admin/categories", icon: Tags },
    { name: "Workflow Persetujuan", href: "/admin/workflows", icon: GitBranch },
  ];

  return (
    <CurrentUserContext.Provider value={user}>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 font-semibold text-slate-900 tracking-tight"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                    OA
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight text-[#1E3A5F] leading-none">
                      Office Approval
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Sistem Pengadaan Kantor
                    </span>
                  </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                  {navigation
                    .filter((item) => item.show)
                    .map((item) => {
                      const active = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            active
                              ? "bg-[#1E3A5F] text-white"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      );
                    })}

                  {isSuperadmin && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAdminDropdownOpen((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          pathname.startsWith("/admin")
                            ? "bg-slate-200 text-slate-900"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        Manajemen Master
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {adminDropdownOpen && (
                        <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50">
                          {adminNavigation.map((sub) => {
                            const SubIcon = sub.icon;
                            const active = pathname === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setAdminDropdownOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                  active
                                    ? "bg-slate-100 text-[#1E3A5F] font-semibold"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <SubIcon className="w-4 h-4 text-slate-500" />
                                {sub.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </nav>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className="relative p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]"
                    aria-label="Notifikasi"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Notifikasi
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {unreadCount} belum dibaca
                        </span>
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-slate-500">
                            Tidak ada notifikasi saat ini
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif.id}
                              type="button"
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors hover:bg-slate-50 flex items-start gap-2.5 ${
                                !notif.readAt ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {notif.type === "ACTION_REQUIRED" ? (
                                  <Clock className="w-4 h-4 text-amber-600" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 leading-snug break-words">
                                  {notif.message}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 inline-block">
                                  {new Date(notif.createdAt).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {user ? (
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-xs font-semibold text-slate-800 leading-tight">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {roleDisplayName(user.role)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="p-2 text-slate-500 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      title="Keluar"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setMobileOpen((prev) => !prev)}
                  className="md:hidden p-2 text-slate-600 rounded-md hover:bg-slate-100"
                  aria-label="Buka Menu"
                >
                  {mobileOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
              {navigation
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                        active
                          ? "bg-[#1E3A5F] text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}

              {isSuperadmin && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Manajemen Master
                  </span>
                  <div className="mt-1 space-y-1">
                    {adminNavigation.map((sub) => {
                      const SubIcon = sub.icon;
                      const active = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                            active
                              ? "bg-slate-100 text-[#1E3A5F]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <SubIcon className="w-4 h-4 text-slate-500" />
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Office Approval &copy; 2026 — Digitalisasi Pengadaan Kantor
            </span>
            <span>Sesuai PRD-OA-001 | Maksimal Keputusan 1 Hari Kerja</span>
          </div>
        </footer>
      </div>
    </CurrentUserContext.Provider>
  );
}
