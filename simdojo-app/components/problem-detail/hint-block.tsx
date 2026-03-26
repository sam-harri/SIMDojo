"use client"

import { useState } from "react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

interface HintBlockProps {
  title: string
  children: React.ReactNode
}

export function HintBlock({ title, children }: HintBlockProps) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 rounded-md border border-border/60 bg-muted/25 px-3 py-2 text-sm text-foreground">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
