import React from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-light rounded-lg ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-5">
      <Skeleton className="h-8 w-8 rounded-full mb-3" />
      <Skeleton className="h-6 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
      <div className="flex items-center gap-3">
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
