export function WorkflowsLoading() {
  return <div className="space-y-6" aria-busy="true" aria-label="Memuat konfigurasi workflow"><div className="space-y-2"><div className="h-6 w-80 animate-pulse rounded bg-slate-200" /><div className="h-3 w-full max-w-xl animate-pulse rounded bg-slate-100" /></div><div className="grid grid-cols-1 gap-6 md:grid-cols-4"><div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" /><div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white md:col-span-3" /></div></div>;
}
