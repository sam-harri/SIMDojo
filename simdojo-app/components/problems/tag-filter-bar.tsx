"use client"

import { VALID_TAGS } from "@/lib/tag-colors"
import { TagBadge } from "./tag-badge"
import { X } from "lucide-react"

interface TagFilterBarProps {
  selectedTags: string[]
  onToggle: (tag: string) => void
  onClear: () => void
}

export function TagFilterBar({ selectedTags, onToggle, onClear }: TagFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {VALID_TAGS.map((tag) => (
        <TagBadge
          key={tag}
          tag={tag}
          selected={selectedTags.includes(tag)}
          onClick={() => onToggle(tag)}
        />
      ))}
      {selectedTags.length > 0 && (
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
