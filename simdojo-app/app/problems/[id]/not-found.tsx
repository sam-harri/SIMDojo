import Link from "next/link"

export default function ProblemNotFound() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-muted-foreground">Problem not found.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Back to problems
        </Link>
      </div>
    </div>
  )
}
