"use client"

import { cn } from "@/lib/utils"
import { CATEGORY_STYLES } from "@/lib/intrinsics/category-styles"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import type { Intrinsic } from "@/lib/intrinsics/types"

interface IntrinsicCardProps {
  intrinsic: Intrinsic
  expanded: boolean
  onToggle: () => void
  showCategory?: boolean
}

export function IntrinsicCard({ intrinsic, expanded, onToggle, showCategory }: IntrinsicCardProps) {
  const catStyle = CATEGORY_STYLES[intrinsic.category]

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div
        className={cn(
          "rounded-xl bg-card ring-1 transition-all duration-200",
          expanded
            ? "ring-primary/25 shadow-sm"
            : "ring-foreground/[0.06] hover:ring-foreground/[0.12]",
        )}
      >
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left">
          <div className={cn("size-2 shrink-0 rounded-full", catStyle?.dot ?? "bg-muted-foreground")} />
          <span className="min-w-0 shrink truncate font-mono text-[13px] font-semibold text-foreground">
            {intrinsic.name}
          </span>
          <span className="hidden min-w-0 shrink truncate font-mono text-[11px] text-muted-foreground sm:inline">
            {intrinsic.detail}
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {showCategory && catStyle && (
              <span
                className={cn(
                  "hidden rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset md:inline-flex",
                  catStyle.classes,
                )}
              >
                {intrinsic.category}
              </span>
            )}
            <Badge
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {intrinsic.instruction}
            </Badge>
            <ChevronRight
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-90",
              )}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border/60 px-4 pt-3 pb-4">
            <code className="block font-mono text-xs font-semibold leading-relaxed text-foreground/90">
              {intrinsic.sig}
            </code>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {intrinsic.description}
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg bg-editor-bg p-4">
              <pre className="font-mono text-[11px] leading-relaxed text-[#e2dfd8]">
                {intrinsic.operation}
              </pre>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {catStyle && (
                <span
                  className={cn(
                    "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                    catStyle.classes,
                  )}
                >
                  {intrinsic.category}
                </span>
              )}
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                {intrinsic.instruction}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
