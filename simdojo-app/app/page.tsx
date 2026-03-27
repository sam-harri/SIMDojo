"use client"

import { useEffect } from "react"
import { useProblemsStore } from "@/lib/stores/problems"
import { ProblemList } from "@/components/problems/problem-list"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const { problems, loading, hydrated, fetch } = useProblemsStore()

  useEffect(() => {
    fetch()
  }, [fetch])

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Problems</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Practice writing SIMD code with AVX2 intrinsics
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 pb-10">
          {loading && !hydrated ? (
            <div className="border-t-2 border-foreground/10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-b border-border/50 px-1 py-3.5">
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <ProblemList problems={problems} />
          )}
        </div>
      </div>
    </div>
  )
}
