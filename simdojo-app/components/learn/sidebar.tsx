"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import type { LearnSection } from "@/lib/content"

interface LearnSidebarProps {
  sections: LearnSection[]
  currentSection: string
  currentPage: string
}

export function LearnSidebar({ sections, currentSection, currentPage }: LearnSidebarProps) {
  return (
    <nav className="hidden lg:block">
      <div className="sticky top-24">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Learn SIMD
        </p>
        <div className="flex flex-col gap-1">
          {sections.map((section, i) => (
            <SectionGroup
              key={section.slug}
              section={section}
              index={i}
              isCurrent={section.slug === currentSection}
              currentPage={currentPage}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}

function SectionGroup({
  section,
  index,
  isCurrent,
  currentPage,
}: {
  section: LearnSection
  index: number
  isCurrent: boolean
  currentPage: string
}) {
  const [expanded, setExpanded] = useState(isCurrent)

  return (
    <div>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-foreground/80 transition-colors hover:text-foreground"
      >
        <ChevronRight
          className={cn(
            "size-3 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
        <span className="font-mono text-[10px] text-muted-foreground">{index + 1}.</span>
        <span className="truncate">{section.title}</span>
      </button>

      {expanded && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-2">
          {section.pages.map((page) => {
            const isActive = isCurrent && page.slug === currentPage
            return (
              <Link
                key={page.slug}
                href={`/learn/${section.slug}/${page.slug}`}
                className={cn(
                  "block rounded-md px-2 py-1 text-xs transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {page.title}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
