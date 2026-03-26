import Link from "next/link"

interface Submission {
  id: number
  problem_slug: string
  problem_title: string
  status: string
  exec_time_ns: number | null
  created_at: string
}

const statusVariants: Record<string, { label: string; className: string }> = {
  accepted: { label: "Accepted", className: "bg-success/15 text-success ring-success/20" },
  wrong_answer: { label: "Wrong Answer", className: "bg-destructive/15 text-destructive ring-destructive/20" },
  compile_error: { label: "CE", className: "bg-muted-foreground/15 text-muted-foreground ring-muted-foreground/20" },
  runtime_error: { label: "RE", className: "bg-destructive/15 text-destructive ring-destructive/20" },
  time_limit: { label: "TLE", className: "bg-warning/15 text-warning ring-warning/20" },
  memory_limit: { label: "MLE", className: "bg-warning/15 text-warning ring-warning/20" },
  pending: { label: "Pending", className: "bg-muted-foreground/15 text-muted-foreground ring-muted-foreground/20" },
  compiling: { label: "Compiling", className: "bg-muted-foreground/15 text-muted-foreground ring-muted-foreground/20" },
  running: { label: "Running", className: "bg-accent/15 text-accent ring-accent/20" },
}

function StatusBadge({ status }: { status: string }) {
  const v = statusVariants[status] ?? { label: status, className: "bg-muted text-muted-foreground ring-muted-foreground/20" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${v.className}`}>
      {v.label}
    </span>
  )
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function RecentSubmissions({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <div className="border-t-2 border-foreground/10 py-12 text-center text-sm text-muted-foreground">
        No submissions yet.
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-foreground/10 px-1 pb-2 text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">
        <span className="flex-1">Problem</span>
        <span className="w-28">Status</span>
        <span className="w-20 text-right">When</span>
      </div>

      {/* Rows */}
      {submissions.map((sub, i) => (
        <div
          key={sub.id}
          className={`flex items-center gap-3 px-1 py-3 ${
            i < submissions.length - 1 ? "border-b border-border/50" : ""
          }`}
        >
          <Link
            href={`/problems/${sub.problem_slug}`}
            className="flex-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {sub.problem_title}
          </Link>

          <span className="w-28">
            <StatusBadge status={sub.status} />
          </span>

          <span className="w-20 text-right font-mono text-xs text-muted-foreground">
            {timeAgo(sub.created_at)}
          </span>
        </div>
      ))}
    </div>
  )
}
