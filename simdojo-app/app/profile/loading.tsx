import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Skeleton className="mb-10 h-8 w-32" />

      <div className="space-y-10">
        <section>
          <Skeleton className="h-4 w-20" />
          <div className="mt-4 border-t-2 border-foreground/10 pt-6">
            <div className="flex justify-center gap-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-24" />
              ))}
            </div>
          </div>
        </section>

        <section>
          <Skeleton className="h-4 w-28" />
          <div className="mt-4 border-t-2 border-foreground/10 pt-6">
            <Skeleton className="h-24 w-full" />
          </div>
        </section>

        <section>
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 border-t-2 border-foreground/10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-border/50 px-1 py-3.5">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
