"use client"

import { cn } from "@/lib/utils"
import { CATEGORY_STYLES } from "@/lib/intrinsics/category-styles"
import { X } from "lucide-react"

interface CategoryFilterProps {
  categories: string[]
  categoryCounts: Record<string, number>
  selected: string[]
  onToggle: (category: string) => void
  onClear: () => void
}

export function CategoryFilter({
  categories,
  categoryCounts,
  selected,
  onToggle,
  onClear,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {categories.map((cat) => {
        const style = CATEGORY_STYLES[cat]
        if (!style) return null
        const isSelected = selected.includes(cat)
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.65rem] font-semibold ring-1 ring-inset transition-all duration-150",
              "cursor-pointer hover:scale-105 active:scale-95",
              isSelected ? style.selectedClasses : style.classes,
              isSelected && "ring-2 shadow-sm",
            )}
          >
            {cat}
            <span className="opacity-60">({categoryCounts[cat] ?? 0})</span>
          </button>
        )
      })}
      {selected.length > 0 && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3" />
          Clear
        </button>
      )}
    </div>
  )
}
