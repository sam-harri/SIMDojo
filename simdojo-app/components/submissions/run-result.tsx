"use client"

import { useState } from "react"
import { Check, X, ChevronDown, ChevronRight } from "lucide-react"
import type { Submission, TestResultItem } from "@/lib/api"

type Tab = "tests" | "output" | "compiler"

const statusInfo: Record<string, { label: string; className: string }> = {
  accepted: { label: "All Tests Passed", className: "text-success" },
  wrong_answer: { label: "Wrong Answer", className: "text-destructive" },
  compile_error: { label: "Compile Error", className: "text-muted-foreground" },
  runtime_error: { label: "Runtime Error", className: "text-destructive" },
  time_limit: { label: "Time Limit Exceeded", className: "text-warning" },
  memory_limit: { label: "Memory Limit Exceeded", className: "text-warning" },
  internal_error: { label: "Internal Error", className: "text-destructive" },
  pending: { label: "Pending…", className: "text-muted-foreground" },
  compiling: { label: "Compiling…", className: "text-muted-foreground" },
  running: { label: "Running…", className: "text-muted-foreground" },
}

export function RunResult({ submission }: { submission: Submission }) {
  const [activeTab, setActiveTab] = useState<Tab>("tests")
  const isTerminal = ["accepted", "wrong_answer", "compile_error", "runtime_error", "time_limit", "memory_limit", "internal_error"].includes(submission.status)

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "tests", label: "Test Results", show: true },
    { key: "output", label: "Program Output", show: true },
    { key: "compiler", label: "Compiler Output", show: !!submission.compiler_output },
  ]

  const info = statusInfo[submission.status] ?? { label: submission.status, className: "text-muted-foreground" }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border/60">
        {tabs.filter(t => t.show).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {/* Status indicator */}
        <div className="ml-auto px-4 py-2">
          <span className={`text-xs font-semibold ${info.className}`}>
            {info.label}
          </span>
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === "tests" && (
          <TestResultsTab submission={submission} isTerminal={isTerminal} />
        )}
        {activeTab === "output" && (
          <div className="p-4">
            {submission.program_output ? (
              <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">
                {submission.program_output}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">No program output.</p>
            )}
          </div>
        )}
        {activeTab === "compiler" && (
          <div className="p-4">
            {submission.compiler_output ? (
              <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">
                {submission.compiler_output}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">No compiler output.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TestResultsTab({ submission, isTerminal }: { submission: Submission; isTerminal: boolean }) {
  if (!isTerminal) {
    return (
      <div className="flex items-center gap-2 p-4">
        <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">
          {submission.status === "compiling" ? "Compiling…" : "Running tests…"}
        </span>
      </div>
    )
  }

  // Compile error — show compiler output inline
  if (submission.status === "compile_error") {
    return (
      <div className="p-4">
        <pre className="whitespace-pre-wrap font-mono text-xs text-destructive">
          {submission.compiler_output || "Compilation failed."}
        </pre>
      </div>
    )
  }

  // Runtime error with no test results
  if (submission.status === "runtime_error" && !submission.test_results?.length) {
    return (
      <div className="p-4">
        <pre className="whitespace-pre-wrap font-mono text-xs text-destructive">
          {submission.runtime_output || "Runtime error occurred."}
        </pre>
      </div>
    )
  }

  if (!submission.test_results?.length) {
    return (
      <div className="p-4">
        <p className="text-xs text-muted-foreground">No test results available.</p>
      </div>
    )
  }

  return (
    <div>
      {submission.test_results.map((test, i) => (
        <TestRow key={i} test={test} index={i + 1} />
      ))}
    </div>
  )
}

function TestRow({ test, index }: { test: TestResultItem; index: number }) {
  const [expanded, setExpanded] = useState(!test.passed)

  return (
    <div className="border-b border-border/40">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30"
      >
        {test.passed ? (
          <Check className="size-3.5 shrink-0 text-success" />
        ) : (
          <X className="size-3.5 shrink-0 text-destructive" />
        )}
        <span className="flex-1 text-xs font-medium text-foreground">
          Test {index}
        </span>
        {expanded ? (
          <ChevronDown className="size-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="space-y-1.5 bg-muted/20 px-4 py-3 pl-11">
          {test.input && (
            <div className="text-xs">
              <span className="text-muted-foreground">Input: </span>
              <span className="font-mono text-foreground">{test.input}</span>
            </div>
          )}
          <div className="text-xs">
            <span className="text-muted-foreground">Expected: </span>
            <span className="font-mono text-foreground">{test.expected}</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Actual: </span>
            <span className={`font-mono ${test.passed ? "text-foreground" : "text-destructive"}`}>
              {test.actual}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

