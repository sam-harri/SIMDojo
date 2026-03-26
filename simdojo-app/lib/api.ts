const JUDGE_URL =
  process.env.NEXT_PUBLIC_JUDGE_URL || "http://localhost:8080"

/* ---------- Types ---------- */

export interface Problem {
  id: string
  title: string
  difficulty: "easy" | "medium" | "hard"
  order: number
  description: string
  starter_code: string
}

export interface TestResultItem {
  passed: boolean
  expected?: string
  actual?: string
  input?: string
}

export interface FirstFailureItem {
  expected: string
  actual: string
}

export interface Submission {
  id: number
  mode: "run" | "submit"
  problem_slug: string
  language: string
  status: string
  tests_passed: number
  tests_total: number
  exec_time_ns: number | null
  compiler_output: string | null
  runtime_output: string | null
  test_results: TestResultItem[] | null
  first_failure: FirstFailureItem | null
  program_output: string | null
  peak_memory_kb: number | null
  created_at: string
}

export interface SubmitResponse {
  submission_id: number
}

/* ---------- Helpers ---------- */

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${JUDGE_URL}${path}`, init)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

/* ---------- Endpoints ---------- */

export function getProblem(id: string) {
  return apiFetch<Problem>(`/api/problems/${encodeURIComponent(id)}`, {
    cache: "no-store",
  })
}

export function submitCode(problemId: string, code: string, token: string) {
  return apiFetch<SubmitResponse>("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ problem_id: problemId, code }),
  })
}

export function runCode(problemId: string, code: string, token: string) {
  return apiFetch<SubmitResponse>("/api/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ problem_id: problemId, code }),
  })
}

