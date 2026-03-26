import { Check, X, Clock, AlertTriangle } from "lucide-react"
import type { Submission } from "@/lib/api"

const statusVariants: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
  accepted: { label: "Accepted", className: "text-success", icon: <Check className="size-4" /> },
  wrong_answer: { label: "Wrong Answer", className: "text-destructive", icon: <X className="size-4" /> },
  compile_error: { label: "Compile Error", className: "text-muted-foreground", icon: <AlertTriangle className="size-4" /> },
  runtime_error: { label: "Runtime Error", className: "text-destructive", icon: <AlertTriangle className="size-4" /> },
  time_limit: { label: "Time Limit Exceeded", className: "text-warning", icon: <Clock className="size-4" /> },
  memory_limit: { label: "Memory Limit Exceeded", className: "text-warning", icon: <AlertTriangle className="size-4" /> },
  internal_error: { label: "Internal Error", className: "text-destructive", icon: <AlertTriangle className="size-4" /> },
  pending: { label: "Pending…", className: "text-muted-foreground" },
  compiling: { label: "Compiling…", className: "text-muted-foreground" },
  running: { label: "Running…", className: "text-muted-foreground" },
}

export function SubmissionResult({ submission }: { submission: Submission }) {
  const v = statusVariants[submission.status] ?? {
    label: submission.status,
    className: "text-muted-foreground",
  }

  const isTerminal = ["accepted", "wrong_answer", "compile_error", "runtime_error", "time_limit", "memory_limit", "internal_error"].includes(submission.status)

  // Loading state
  if (!isTerminal) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">{v.label}</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-4 py-3">
      {/* Status header */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 ${v.className}`}>
          {v.icon}
          <span className="text-sm font-semibold">{v.label}</span>
        </div>
        {submission.tests_total > 0 && (
          <span className="font-mono text-xs text-muted-foreground">
            {submission.tests_passed}/{submission.tests_total} tests passed
          </span>
        )}
      </div>

      {/* Performance stats for accepted submissions */}
      {submission.status === "accepted" && (submission.exec_time_ns || submission.peak_memory_kb) && (
        <div className="flex items-center gap-4">
          {submission.exec_time_ns && (
            <div className="text-xs">
              <span className="text-muted-foreground">Runtime: </span>
              <span className="font-mono font-medium text-foreground">{formatTime(submission.exec_time_ns)}</span>
            </div>
          )}
          {submission.peak_memory_kb && (
            <div className="text-xs">
              <span className="text-muted-foreground">Memory: </span>
              <span className="font-mono font-medium text-foreground">{formatMemory(submission.peak_memory_kb)}</span>
            </div>
          )}
        </div>
      )}

      {/* First failure detail (wrong answer) */}
      {submission.status === "wrong_answer" && submission.first_failure && (
        <div className="space-y-1.5 border-l-2 border-destructive/30 pl-3">
          <div className="text-xs">
            <span className="text-muted-foreground">Expected: </span>
            <span className="font-mono text-foreground">{submission.first_failure.expected}</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Actual: </span>
            <span className="font-mono text-destructive">{submission.first_failure.actual}</span>
          </div>
        </div>
      )}

      {/* Compiler output */}
      {submission.compiler_output && (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap border-t border-border/40 pt-3 font-mono text-xs text-foreground">
          {submission.compiler_output}
        </pre>
      )}

      {/* Runtime output */}
      {submission.runtime_output && !submission.compiler_output && (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap border-t border-border/40 pt-3 font-mono text-xs text-foreground">
          {submission.runtime_output}
        </pre>
      )}

    </div>
  )
}

function formatTime(ns: number): string {
  if (ns < 1000) return `${ns}ns`
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(1)}µs`
  if (ns < 1_000_000_000) return `${(ns / 1_000_000).toFixed(2)}ms`
  return `${(ns / 1_000_000_000).toFixed(3)}s`
}

function formatMemory(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
