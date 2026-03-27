import { ProblemCard } from "./problem-card"
import type { ProblemItem } from "@/lib/actions"

export { type ProblemItem }

export function ProblemGrid({ problems, hasActiveFilter }: { problems: ProblemItem[]; hasActiveFilter?: boolean }) {
  if (problems.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {hasActiveFilter ? "No problems match the selected tags." : "No problems available yet."}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      {problems.map((problem) => (
        <ProblemCard key={problem.id} problem={problem} />
      ))}
    </div>
  )
}
