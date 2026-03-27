"use server"

import { db } from "@/lib/db"
import { problem, problemCompletion, submission } from "@/lib/db/schema"
import { eq, asc, and, sql, desc } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"
import type { Submission, TestResultItem, FirstFailureItem } from "@/lib/api"

/* ---------- Types ---------- */

export interface ProblemItem {
  id: number
  slug: string
  title: string
  difficulty: string
  sortOrder: number
  tags: string[]
  status: "solved" | "attempted" | "unattempted"
}

export interface ProfileStats {
  completions: { easy: number; medium: number; hard: number }
  totals: { easy: number; medium: number; hard: number }
  recentSubmissions: {
    id: number
    problemSlug: string
    problemTitle: string
    status: string
    execTimeNs: number | null
    createdAt: string
  }[]
  submissionCalendar: Record<string, number>
}

/* ---------- Problems ---------- */

export async function fetchProblems(): Promise<ProblemItem[]> {
  const { userId } = await auth()

  const problems = await db
    .select()
    .from(problem)
    .where(eq(problem.isPublished, true))
    .orderBy(asc(problem.sortOrder))

  let completedIds = new Set<number>()
  let attemptedIds = new Set<number>()

  if (userId) {
    const [completions, attempts] = await Promise.all([
      db
        .select({ problemId: problemCompletion.problemId })
        .from(problemCompletion)
        .where(eq(problemCompletion.userId, userId)),
      db
        .selectDistinct({ problemId: submission.problemId })
        .from(submission)
        .where(eq(submission.userId, userId)),
    ])

    completedIds = new Set(completions.map((c) => c.problemId))
    attemptedIds = new Set(attempts.map((a) => a.problemId))
  }

  return problems.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    sortOrder: p.sortOrder,
    tags: p.tags ?? [],
    status: completedIds.has(p.id)
      ? "solved"
      : attemptedIds.has(p.id)
        ? "attempted"
        : "unattempted",
  }))
}

/* ---------- Profile Stats ---------- */

export async function fetchProfileStats(): Promise<ProfileStats | null> {
  const { userId } = await auth()
  if (!userId) return null

  // All queries in parallel
  const [problems, completions, recentSubs, calendarRows] = await Promise.all([
    // Total problems by difficulty
    db
      .select({ difficulty: problem.difficulty })
      .from(problem)
      .where(eq(problem.isPublished, true)),

    // User completions by difficulty
    db
      .select({ difficulty: problem.difficulty })
      .from(problemCompletion)
      .innerJoin(problem, eq(problem.id, problemCompletion.problemId))
      .where(eq(problemCompletion.userId, userId)),

    // Recent submissions (last 20)
    db
      .select({
        id: submission.id,
        problemSlug: problem.slug,
        problemTitle: problem.title,
        status: submission.status,
        execTimeNs: submission.execTimeNs,
        createdAt: submission.createdAt,
      })
      .from(submission)
      .innerJoin(problem, eq(problem.id, submission.problemId))
      .where(eq(submission.userId, userId))
      .orderBy(desc(submission.createdAt))
      .limit(20),

    // Submission calendar (last 365 days)
    db
      .select({
        day: sql<string>`DATE(${submission.createdAt})`.as("day"),
        count: sql<number>`COUNT(*)::int`.as("count"),
      })
      .from(submission)
      .where(
        sql`${submission.userId} = ${userId} AND ${submission.createdAt} >= NOW() - INTERVAL '365 days'`
      )
      .groupBy(sql`DATE(${submission.createdAt})`),
  ])

  // Count totals by difficulty
  const totals = { easy: 0, medium: 0, hard: 0 }
  for (const p of problems) {
    if (p.difficulty in totals) totals[p.difficulty as keyof typeof totals]++
  }

  // Count completions by difficulty
  const comp = { easy: 0, medium: 0, hard: 0 }
  for (const c of completions) {
    if (c.difficulty in comp) comp[c.difficulty as keyof typeof comp]++
  }

  // Build calendar map
  const submissionCalendar: Record<string, number> = {}
  for (const row of calendarRows) {
    submissionCalendar[row.day] = row.count
  }

  return {
    completions: comp,
    totals,
    recentSubmissions: recentSubs.map((s) => ({
      id: s.id,
      problemSlug: s.problemSlug,
      problemTitle: s.problemTitle,
      status: s.status,
      execTimeNs: s.execTimeNs,
      createdAt: s.createdAt,
    })),
    submissionCalendar,
  }
}

/* ---------- Submission polling ---------- */

export async function fetchSubmission(id: number): Promise<Submission | null> {
  const { userId } = await auth()
  if (!userId) return null

  const rows = await db
    .select({
      id: submission.id,
      mode: submission.mode,
      problemSlug: problem.slug,
      language: submission.language,
      status: submission.status,
      testsPassed: submission.testsPassed,
      testsTotal: submission.testsTotal,
      execTimeNs: submission.execTimeNs,
      compilerOutput: submission.compilerOutput,
      runtimeOutput: submission.runtimeOutput,
      testResults: submission.testResults,
      firstFailure: submission.firstFailure,
      programOutput: submission.programOutput,
      peakMemoryKb: submission.peakMemoryKb,
      createdAt: submission.createdAt,
    })
    .from(submission)
    .innerJoin(problem, eq(problem.id, submission.problemId))
    .where(and(eq(submission.id, id), eq(submission.userId, userId)))
    .limit(1)

  if (rows.length === 0) return null

  const s = rows[0]
  return {
    id: s.id,
    mode: s.mode as "run" | "submit",
    problem_slug: s.problemSlug,
    language: s.language,
    status: s.status,
    tests_passed: s.testsPassed,
    tests_total: s.testsTotal,
    exec_time_ns: s.execTimeNs,
    compiler_output: s.compilerOutput,
    runtime_output: s.runtimeOutput,
    test_results: s.testResults as TestResultItem[] | null,
    first_failure: s.firstFailure as FirstFailureItem | null,
    program_output: s.programOutput,
    peak_memory_kb: s.peakMemoryKb,
    created_at: s.createdAt,
  }
}
