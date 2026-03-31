"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { CATEGORY_STYLES, CATEGORY_ORDER } from "@/lib/intrinsics/category-styles"
import { IntrinsicCard } from "./intrinsic-card"
import type { Intrinsic } from "@/lib/intrinsics/types"
import { Search } from "lucide-react"

interface IntrinsicListProps {
  intrinsics: Intrinsic[]
  totalCount: number
  isSearching: boolean
  expandedName: string | null
  onToggleExpand: (name: string) => void
}

export function IntrinsicList({
  intrinsics,
  totalCount,
  isSearching,
  expandedName,
  onToggleExpand,
}: IntrinsicListProps) {
  const grouped = useMemo(() => {
    if (isSearching) return null
    const groups: Record<string, Intrinsic[]> = {}
    for (const i of intrinsics) {
      ;(groups[i.category] ??= []).push(i)
    }
    return CATEGORY_ORDER.filter((cat) => groups[cat]).map((cat) => ({
      category: cat,
      items: groups[cat],
    }))
  }, [intrinsics, isSearching])

  if (intrinsics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="mb-3 size-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No intrinsics found</p>
        <p className="mt-1 text-xs text-muted-foreground/60">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-mono font-semibold text-foreground">{intrinsics.length}</span>
        {intrinsics.length !== totalCount && (
          <>
            {" "}of <span className="font-mono font-semibold text-foreground">{totalCount}</span>
          </>
        )}{" "}
        intrinsics
      </p>

      {isSearching || !grouped ? (
        <div className="flex flex-col gap-1.5">
          {intrinsics.map((i) => (
            <IntrinsicCard
              key={i.name}
              intrinsic={i}
              expanded={expandedName === i.name}
              onToggle={() => onToggleExpand(i.name)}
              showCategory
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map(({ category, items }) => {
            const catStyle = CATEGORY_STYLES[category]
            return (
              <section key={category}>
                <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-3 bg-background/90 px-1 py-2 backdrop-blur-sm">
                  <div className={cn("h-5 w-[3px] rounded-full", catStyle?.dot ?? "bg-muted-foreground")} />
                  <h2 className="font-brand text-sm font-bold tracking-tight text-foreground">
                    {category}
                  </h2>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {items.map((i) => (
                    <IntrinsicCard
                      key={i.name}
                      intrinsic={i}
                      expanded={expandedName === i.name}
                      onToggle={() => onToggleExpand(i.name)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
