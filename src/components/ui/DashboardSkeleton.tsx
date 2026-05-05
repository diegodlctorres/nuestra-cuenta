function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

function AccountCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <SkeletonBlock className="h-11 w-11 rounded-xl bg-slate-100" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <SkeletonBlock className="mb-3 h-8 w-36" />
      <SkeletonBlock className="h-4 w-44 max-w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando inicio">
      <div className="grid grid-cols-1 gap-4">
        <AccountCardSkeleton />
        <AccountCardSkeleton />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <SkeletonBlock className="h-11 w-11 rounded-xl bg-slate-100" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
        </div>
        <SkeletonBlock className="h-7 w-24" />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-4 w-14" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-full bg-slate-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-36 max-w-full" />
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-3 w-40 max-w-full" />
            </div>
            <SkeletonBlock className="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
