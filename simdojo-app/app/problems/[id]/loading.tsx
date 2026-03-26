import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
      {/* Left panel skeleton */}
      <div className="flex-1 border-b border-border p-6 md:border-b-0 md:border-r">
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="mt-6 h-24 w-full rounded-md" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Right panel skeleton */}
      <div className="flex flex-1 flex-col md:min-w-0">
        <div className="min-h-0 flex-1 bg-editor-bg" />
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}
