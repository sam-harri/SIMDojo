import { cn } from "@/lib/utils"

const variants = {
  easy: "bg-difficulty-easy/12 text-difficulty-easy ring-difficulty-easy/20",
  medium: "bg-difficulty-medium/12 text-difficulty-medium ring-difficulty-medium/20",
  hard: "bg-difficulty-hard/12 text-difficulty-hard ring-difficulty-hard/20",
} as const

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const variant = variants[difficulty as keyof typeof variants] ?? variants.easy

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
        variant,
      )}
    >
      {difficulty}
    </span>
  )
}
