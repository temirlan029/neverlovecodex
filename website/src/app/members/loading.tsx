import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/Skeleton";

export default function MembersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-40 mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <SkeletonTable rows={5} />
    </div>
  );
}
