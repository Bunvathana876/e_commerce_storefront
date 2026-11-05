interface ProductSkeletonProps {
  className?: string;
}

export default function ProductSkeleton({ className = "" }: ProductSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-2xl border border-slate-200/90 bg-white ${className}`}
    >
      <div className="aspect-square w-full animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
