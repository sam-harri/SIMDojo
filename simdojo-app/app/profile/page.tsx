"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useProfileStore } from "@/lib/stores/profile"
import { DifficultySemicircles } from "@/components/profile/difficulty-semicircles"
import { SubmissionCalendar } from "@/components/profile/submission-calendar"
import { RecentSubmissions } from "@/components/profile/recent-submissions"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const { stats, loading, hydrated, fetch } = useProfileStore()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/")
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isSignedIn) fetch()
  }, [isSignedIn, fetch])

  if (!isLoaded || !isSignedIn) return null

  const showSkeleton = loading && !hydrated

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-10 text-2xl font-bold tracking-tight">Profile</h1>

      <div className="space-y-10">
        {/* Progress */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Progress
          </h2>
          <div className="mt-4 border-t-2 border-foreground/10 pt-6">
            {showSkeleton ? (
              <div className="flex justify-center gap-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-24" />
                ))}
              </div>
            ) : (
              <DifficultySemicircles
                completions={stats?.completions ?? { easy: 0, medium: 0, hard: 0 }}
                totals={stats?.totals ?? { easy: 0, medium: 0, hard: 0 }}
              />
            )}
          </div>
        </section>

        {/* Submission Calendar */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Submissions
          </h2>
          <div className="mt-4 border-t-2 border-foreground/10 pt-6">
            {showSkeleton ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <SubmissionCalendar calendar={stats?.submissionCalendar ?? {}} />
            )}
          </div>
        </section>

        {/* Recent Submissions */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Submissions
          </h2>
          <div className="mt-4">
            {showSkeleton ? (
              <div className="border-t-2 border-foreground/10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-border/50 px-1 py-3.5">
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <RecentSubmissions
                submissions={(stats?.recentSubmissions ?? []).map((s) => ({
                  id: s.id,
                  problem_slug: s.problemSlug,
                  problem_title: s.problemTitle,
                  status: s.status,
                  exec_time_ns: s.execTimeNs,
                  created_at: s.createdAt,
                }))}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
