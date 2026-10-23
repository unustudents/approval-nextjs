export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="h-5 w-40 bg-slate-200 rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-slate-50 border border-slate-100 rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
