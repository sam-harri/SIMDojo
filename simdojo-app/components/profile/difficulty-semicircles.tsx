"use client"

interface SemicircleProps {
  label: string
  solved: number
  total: number
  color: string
}

function Semicircle({ label, solved, total, color }: SemicircleProps) {
  const radius = 40
  const circumference = Math.PI * radius
  const progress = total > 0 ? solved / total : 0
  const offset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="60" viewBox="0 0 100 60">
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted"
        />
        {/* Progress arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        {/* Text */}
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="fill-foreground text-lg font-semibold"
          style={{ fontSize: "18px", fontFamily: "var(--font-mono)" }}
        >
          {solved}/{total}
        </text>
      </svg>
      <span className="text-xs font-medium capitalize text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

interface DifficultySemicirclesProps {
  completions: { easy: number; medium: number; hard: number }
  totals: { easy: number; medium: number; hard: number }
}

export function DifficultySemicircles({ completions, totals }: DifficultySemicirclesProps) {
  return (
    <div className="flex items-center justify-center gap-8">
      <Semicircle
        label="Easy"
        solved={completions.easy}
        total={totals.easy}
        color="var(--difficulty-easy)"
      />
      <Semicircle
        label="Medium"
        solved={completions.medium}
        total={totals.medium}
        color="var(--difficulty-medium)"
      />
      <Semicircle
        label="Hard"
        solved={completions.hard}
        total={totals.hard}
        color="var(--difficulty-hard)"
      />
    </div>
  )
}
