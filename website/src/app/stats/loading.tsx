import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/Skeleton";

export default function StatsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-64 mb-10" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="mb-12">
        <Skeleton className="h-6 w-36 mb-4" />
        <SkeletonTable rows={5} />
      </div>

      <div className="mb-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="bg-surface rounded-xl border border-surface-border p-6">
          <div className="flex items-end gap-1 h-40">
            {[20, 10, 30, 15, 25, 40, 50, 35, 60, 45, 70, 80, 55, 65, 75, 90, 85, 95, 100, 78, 60, 40, 25, 15].map((h, i) => (
              <div key={i} className="flex-1">
                <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
