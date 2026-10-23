export default function SubmissionDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded-md" />
          <div className="h-4 w-36 bg-slate-100 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-slate-200 rounded-md" />
          <div className="h-9 w-24 bg-slate-200 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
            <div className="h-20 bg-slate-50 rounded" />
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-50 rounded" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="h-5 w-36 bg-slate-200 rounded" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-50 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
