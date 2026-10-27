export function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Memuat dashboard">
      <div className="space-y-2">
        <div className="h-6 w-64 rounded bg-slate-200" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
