export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-3xl bg-ink/10 ${className}`} />;
}
export function CardSkeleton() {
  return (
    <div className="rounded-[1.75rem] border-[3px] border-ink/10 p-4">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mt-4 h-5 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  );
}
