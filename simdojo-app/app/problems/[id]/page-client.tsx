"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { CodeEditor } from "@/components/editor/code-editor"
import { ProblemDescription } from "@/components/problem-detail/problem-description"
import { SubmissionResult } from "@/components/submissions/submission-result"
import { RunResult } from "@/components/submissions/run-result"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { RotateCcw, Play, Send } from "lucide-react"
import { submitCode, runCode, type Problem, type Submission } from "@/lib/api"
import { fetchSubmission } from "@/lib/actions"

const DIFFICULTY_CLASSES: Record<string, string> = {
  easy: "text-difficulty-easy",
  medium: "text-difficulty-medium",
  hard: "text-difficulty-hard",
}

const TERMINAL_STATUSES = ["accepted", "wrong_answer", "compile_error", "runtime_error", "time_limit", "memory_limit", "internal_error"]
const MAX_POLL_ATTEMPTS = 15

interface ProblemPageClientProps {
  problem: Problem
}

export function ProblemPageClient({ problem }: ProblemPageClientProps) {
  const { isSignedIn, getToken } = useAuth()
  const [code, setCode] = useState(problem.starter_code)
  const [activeMode, setActiveMode] = useState<"run" | "submit" | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollTimedOut, setPollTimedOut] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [acEnabled, setAcEnabled] = useState(true)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollCountRef = useRef(0)

  const handleChange = useCallback((value: string) => {
    setCode(value)
  }, [])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  async function pollSubmission(id: number) {
    pollCountRef.current++

    if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
      setPollTimedOut(true)
      setActiveMode(null)
      return
    }

    try {
      const sub = await fetchSubmission(id)
      if (!sub) {
        setError("Submission not found")
        setActiveMode(null)
        return
      }
      setSubmission(sub)
      if (!TERMINAL_STATUSES.includes(sub.status)) {
        pollRef.current = setTimeout(() => pollSubmission(id), 1000)
      } else {
        setActiveMode(null)
      }
    } catch {
      setError("Failed to fetch submission status")
      setActiveMode(null)
    }
  }

  async function handleAction(mode: "run" | "submit") {
    setError(null)
    setSubmission(null)
    setPollTimedOut(false)
    setActiveMode(mode)
    pollCountRef.current = 0

    try {
      const token = await getToken()
      if (!token) {
        setError("Not authenticated")
        setActiveMode(null)
        return
      }
      const apiFn = mode === "run" ? runCode : submitCode
      const res = await apiFn(problem.id, code, token)
      pollSubmission(res.submission_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
      setActiveMode(null)
    }
  }

  function handleReset() {
    setCode(problem.starter_code)
    setResetKey((k) => k + 1)
  }

  const isLoading = activeMode !== null

  return (
    <div className="h-full overflow-hidden overscroll-none">
      <ResizablePanelGroup orientation="horizontal">
        {/* Left panel — problem description */}
        <ResizablePanel defaultSize="45%" minSize="20%">
          <div className="h-full overflow-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6">
                <div className="mb-1 flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{problem.order}
                  </span>
                  <span
                    className={`text-xs font-medium uppercase tracking-wider ${DIFFICULTY_CLASSES[problem.difficulty] ?? ""}`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {problem.title}
                </h1>
              </div>
              <ProblemDescription markdown={problem.description} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel — editor + output */}
        <ResizablePanel defaultSize="55%" minSize="20%">
          <ResizablePanelGroup orientation="vertical">
            {/* Editor section */}
            <ResizablePanel defaultSize="70%" minSize="20%">
              <div className="flex h-full flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] font-medium text-muted-foreground">
                      C++ / AVX2
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 gap-1.5 px-2 text-xs text-muted-foreground">
                      <RotateCcw className="size-3" />
                      Reset
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAcEnabled((v) => !v)} className={`h-7 px-2 text-xs ${acEnabled ? "text-foreground" : "text-muted-foreground"}`}>
                      Autocomplete {acEnabled ? "on" : "off"}
                    </Button>
                  </div>
                  {isSignedIn ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("run")}
                        disabled={isLoading}
                        className="h-7 gap-1.5 px-3 text-xs"
                      >
                        <Play className="size-3" />
                        {activeMode === "run" ? "Running…" : "Run Tests"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction("submit")}
                        disabled={isLoading}
                        className="h-7 gap-1.5 px-3 text-xs"
                      >
                        <Send className="size-3" />
                        {activeMode === "submit" ? "Judging…" : "Submit"}
                      </Button>
                    </div>
                  ) : (
                    <Button disabled size="sm" className="h-7 text-xs">
                      Sign in to submit
                    </Button>
                  )}
                </div>

                {/* Editor */}
                <div className="min-h-0 flex-1 overflow-hidden">
                  <CodeEditor key={resetKey} initialCode={code} onChange={handleChange} acEnabled={acEnabled} />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Output section */}
            <ResizablePanel defaultSize="30%" minSize="10%">
              <div className="h-full overflow-auto bg-card">
                {pollTimedOut && (
                  <div className="border-b border-warning/20 bg-warning/10 px-4 py-2.5">
                    <span className="text-xs text-warning">Taking longer than expected</span>
                  </div>
                )}
                {error && (
                  <div className="px-4 py-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                {submission && submission.mode === "run" && (
                  <RunResult submission={submission} />
                )}
                {submission && submission.mode === "submit" && (
                  <SubmissionResult submission={submission} />
                )}
                {!error && !submission && !pollTimedOut && (
                  <div className="px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Output will appear here after you run or submit.
                    </p>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
