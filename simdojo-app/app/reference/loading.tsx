import { Skeleton } from "@/components/ui/skeleton"

export default function ReferenceLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
        <Skeleton className="mt-5 h-9 w-full rounded-lg" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-md" />
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-10">
          <Skeleton className="mb-4 h-4 w-36" />
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
