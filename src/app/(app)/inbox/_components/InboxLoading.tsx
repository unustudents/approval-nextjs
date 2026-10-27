export function InboxLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Memuat inbox tugas">
      <div className="space-y-2">
        <div className="h-6 w-80 rounded bg-slate-200" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-100" />
      </div>
      <div className="space-y-px overflow-hidden rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-28 border-b border-slate-100 last:border-b-0" />
        ))}
      </div>
    </div>
  );
}
