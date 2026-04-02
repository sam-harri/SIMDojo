import Link from "next/link"
import { Check, Minus } from "lucide-react"
import { DifficultyBadge } from "./difficulty-badge"
import { TagBadge } from "./tag-badge"
import type { ProblemItem } from "@/lib/actions"

function StatusIcon({ status }: { status: ProblemItem["status"] }) {
  if (status === "solved") {
    return <Check className="size-3.5 text-success" strokeWidth={2.5} />
  }
  if (status === "attempted") {
    return <Minus className="size-3 text-muted-foreground/60" strokeWidth={2.5} />
  }
  return null
}

export function ProblemCard({ problem }: { problem: ProblemItem }) {
  return (
    <Link
      href={`/problems/${problem.slug}`}
      className="group flex items-center gap-2 rounded-xl bg-card px-3 py-3 ring-1 ring-foreground/[0.06] transition-all duration-200 hover:bg-primary/[0.04] hover:ring-primary/30 dark:hover:bg-primary/[0.06] sm:gap-3 sm:px-4"
    >
      <span className="flex w-4 shrink-0 justify-center sm:w-5">
        <StatusIcon status={problem.status} />
      </span>

      <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground sm:w-8">
        #{problem.sortOrder}
      </span>

      <DifficultyBadge difficulty={problem.difficulty} />

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
        {problem.title}
      </span>

      <div className="hidden sm:flex flex-wrap items-center gap-1">
        {problem.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} size="sm" />
        ))}
      </div>
    </Link>
  )
}
