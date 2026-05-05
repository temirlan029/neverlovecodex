import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function ShameLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-52 mb-10" />

      <div className="mb-12">
        <Skeleton className="h-6 w-52 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      <div className="mb-12">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <div className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
