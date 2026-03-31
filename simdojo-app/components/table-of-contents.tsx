"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import type { TocHeading } from "@/lib/content-utils"

interface TableOfContentsProps {
  headings: TocHeading[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("")
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading (topmost in viewport)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    )

    for (const el of elements) {
      observerRef.current.observe(el)
    }

    return () => observerRef.current?.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  // Determine which h2 is active (either directly or via its child h3)
  const activeH2Id = getActiveH2(headings, activeId)

  return (
    <nav className="hidden xl:block">
      <div className="sticky top-24">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          On this page
        </p>
        <ul className="flex flex-col gap-0.5 border-l border-border">
          {headings.map((heading) => {
            const isActive = activeId === heading.id
            const isH3 = heading.level === 3
            const parentExpanded = !isH3 || activeH2Id === getParentH2(headings, heading.id)

            if (isH3 && !parentExpanded) return null

            return (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" })
                    history.replaceState(null, "", `#${heading.id}`)
                    setActiveId(heading.id)
                  }}
                  className={cn(
                    "block border-l-2 py-1 text-xs leading-relaxed transition-colors -ml-px",
                    isH3 ? "pl-5" : "pl-3",
                    isActive
                      ? "border-primary font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {heading.text}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

function getActiveH2(headings: TocHeading[], activeId: string): string | null {
  const idx = headings.findIndex((h) => h.id === activeId)
  if (idx === -1) return null
  if (headings[idx].level === 2) return headings[idx].id
  // Walk backwards to find parent h2
  for (let i = idx - 1; i >= 0; i--) {
    if (headings[i].level === 2) return headings[i].id
  }
  return null
}

function getParentH2(headings: TocHeading[], h3Id: string): string | null {
  const idx = headings.findIndex((h) => h.id === h3Id)
  if (idx === -1) return null
  for (let i = idx - 1; i >= 0; i--) {
    if (headings[i].level === 2) return headings[i].id
  }
  return null
}
