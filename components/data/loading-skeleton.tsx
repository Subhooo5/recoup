import { cn } from "@/lib/utils";

type LoadingSkeletonShape = "row-list" | "card-grid" | "detail-page";

type LoadingSkeletonProps = {
  shape: LoadingSkeletonShape;
  count?: number;
  className?: string;
};

const skeletonBlockClassName = "animate-pulse rounded-lg bg-muted";

const rangeOf = (count: number) => Array.from({ length: count }, (_, index) => index);

function RowListSkeleton({ count }: { count: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border px-4 py-3">
        <span className={cn(skeletonBlockClassName, "block h-4 w-40")} />
      </div>
      <div className="divide-y divide-border">
        {rangeOf(count).map((row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3.5">
            <span className={cn(skeletonBlockClassName, "h-4 w-16 shrink-0")} />
            <span className={cn(skeletonBlockClassName, "h-5 w-36 shrink-0")} />
            <span className={cn(skeletonBlockClassName, "h-4 flex-1")} />
            <span className={cn(skeletonBlockClassName, "h-5 w-20 shrink-0")} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CardGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rangeOf(count).map((card) => (
        <div key={card} className="rounded-xl border border-border p-5">
          <span className={cn(skeletonBlockClassName, "block h-5 w-28")} />
          <span className={cn(skeletonBlockClassName, "mt-4 block h-8 w-36")} />
          <span className={cn(skeletonBlockClassName, "mt-3 block h-4 w-full")} />
          <span className={cn(skeletonBlockClassName, "mt-2 block h-4 w-2/3")} />
        </div>
      ))}
    </div>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-border p-5">
        <span className={cn(skeletonBlockClassName, "block h-6 w-52")} />
        <div className="mt-4 flex flex-wrap gap-3">
          {rangeOf(4).map((field) => (
            <span key={field} className={cn(skeletonBlockClassName, "h-5 w-28")} />
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          {rangeOf(5).map((stage) => (
            <div key={stage} className="rounded-xl border border-border p-5">
              <span className={cn(skeletonBlockClassName, "block h-5 w-32")} />
              <span className={cn(skeletonBlockClassName, "mt-4 block h-4 w-full")} />
              <span className={cn(skeletonBlockClassName, "mt-2 block h-4 w-4/5")} />
              <span className={cn(skeletonBlockClassName, "mt-2 block h-4 w-3/5")} />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border p-5">
          <span className={cn(skeletonBlockClassName, "block h-5 w-24")} />
          <div className="mt-4 grid gap-3">
            {rangeOf(6).map((row) => (
              <span key={row} className={cn(skeletonBlockClassName, "block h-9 w-full")} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  shape,
  count,
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={className} aria-hidden>
      {shape === "row-list" ? <RowListSkeleton count={count ?? 6} /> : null}
      {shape === "card-grid" ? <CardGridSkeleton count={count ?? 3} /> : null}
      {shape === "detail-page" ? <DetailPageSkeleton /> : null}
    </div>
  );
}
