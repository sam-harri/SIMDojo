"use client"

import { useEffect, useState } from "react"
import { useProblemsStore } from "@/lib/stores/problems"
import { ProblemGrid } from "@/components/problems/problem-list"
import { TagFilterBar } from "@/components/problems/tag-filter-bar"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const { problems, loading, hydrated, fetch } = useProblemsStore()
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    fetch()
  }, [fetch])

  const filteredProblems =
    selectedTags.length === 0
      ? problems
      : problems.filter((p) => p.tags.some((t) => selectedTags.includes(t)))

  const handleToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-4xl px-4 pt-10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Problems</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Practice writing SIMD code with AVX2 intrinsics
        </p>
        <div className="mt-4">
          <TagFilterBar
            selectedTags={selectedTags}
            onToggle={handleToggle}
            onClear={() => setSelectedTags([])}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 pb-10">
          {loading && !hydrated ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/[0.06]"
                >
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-5 w-14 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                  <div className="ml-auto flex gap-1">
                    <Skeleton className="h-4 w-12 rounded-md" />
                    <Skeleton className="h-4 w-14 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ProblemGrid problems={filteredProblems} hasActiveFilter={selectedTags.length > 0} />
          )}
        </div>
      </div>
    </div>
  )
}
