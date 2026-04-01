import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { problem } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

const BASE = "https://simdojo.dev"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const problems = await db
    .select({ slug: problem.slug, updatedAt: problem.updatedAt })
    .from(problem)
    .where(eq(problem.isPublished, true))
    .orderBy(asc(problem.sortOrder))

  return [
    { url: BASE, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/learn`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/reference`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...problems.map((p) => ({
      url: `${BASE}/problems/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ]
}
