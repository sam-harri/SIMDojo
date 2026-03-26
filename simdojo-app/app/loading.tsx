import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="border-t-2 border-foreground/10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 py-3.5 px-1">
            <Skeleton className="h-5 w-full rounded-none" />
          </div>
        ))}
      </div>
    </div>
  )
}
