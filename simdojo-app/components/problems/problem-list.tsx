import Link from "next/link"
import { Check, Minus } from "lucide-react"
import { DifficultyBadge } from "./difficulty-badge"

export interface ProblemItem {
  id: number
  slug: string
  title: string
  difficulty: string
  sortOrder: number
  status: "solved" | "attempted" | "unattempted"
}

function StatusIcon({ status }: { status: ProblemItem["status"] }) {
  if (status === "solved") {
    return <Check className="size-4 text-success" strokeWidth={2.5} />
  }
  if (status === "attempted") {
    return <Minus className="size-3.5 text-muted-foreground/60" strokeWidth={2.5} />
  }
  return null
}

export function ProblemList({ problems }: { problems: ProblemItem[] }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-foreground/10 px-1 pb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="w-6" />
        <span className="w-7 text-center">#</span>
        <span className="flex-1">Title</span>
        <span className="w-24 text-right">Difficulty</span>
      </div>

      {/* Rows */}
      {problems.map((problem) => (
        <Link
          key={problem.id}
          href={`/problems/${problem.slug}`}
          className="group flex items-center gap-3 border-b border-border/50 px-1 py-3.5 transition-colors hover:bg-primary/[0.04] dark:hover:bg-primary/[0.06]"
        >
          <span className="flex w-6 justify-center">
            <StatusIcon status={problem.status} />
          </span>

          <span className="w-7 text-center font-mono text-xs text-muted-foreground">
            {problem.sortOrder}
          </span>

          <span className="flex-1 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            {problem.title}
          </span>

          <span className="w-24 text-right">
            <DifficultyBadge difficulty={problem.difficulty} />
          </span>
        </Link>
      ))}

      {problems.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No problems available yet.
        </div>
      )}
    </div>
  )
}
