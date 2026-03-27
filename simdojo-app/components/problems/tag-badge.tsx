import { cn } from "@/lib/utils"
import { TAG_STYLES } from "@/lib/tag-colors"

interface TagBadgeProps {
  tag: string
  size?: "sm" | "md"
  selected?: boolean
  onClick?: () => void
}

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[0.65rem]",
  md: "px-2 py-1 text-xs",
}

export function TagBadge({ tag, size = "md", selected, onClick }: TagBadgeProps) {
  const style = TAG_STYLES[tag]
  if (!style) return null

  const classes = selected ? style.selectedClasses : style.classes

  return (
    <span
      role={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-md font-semibold ring-1 ring-inset transition-all duration-150",
        sizeClasses[size],
        classes,
        onClick && "cursor-pointer hover:scale-105 active:scale-95",
        selected && "ring-2 shadow-sm",
      )}
    >
      {tag}
    </span>
  )
}
