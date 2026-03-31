"use client"

import { ISA_EXTENSIONS } from "@/lib/intrinsics/registry"
import { cn } from "@/lib/utils"

interface IsaTabsProps {
  selectedIsa: string
  onSelect: (id: string) => void
}

export function IsaTabs({ selectedIsa, onSelect }: IsaTabsProps) {
  return (
    <div className="flex items-center gap-1">
      {ISA_EXTENSIONS.map((ext) => (
        <button
          key={ext.id}
          onClick={() => onSelect(ext.id)}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-xs font-semibold tracking-wide transition-all",
            selectedIsa === ext.id
              ? "bg-primary/15 text-primary ring-1 ring-primary/30"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {ext.label}
          <span className="ml-1.5 text-[10px] opacity-60">{ext.data.length}</span>
        </button>
      ))}
    </div>
  )
}
