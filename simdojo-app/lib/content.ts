import fs from "fs"
import path from "path"
import matter from "gray-matter"

const contentDir = path.join(process.cwd(), "content")

// ─── Types ───────────────────────────────────────────────────────────

export type Author = {
  id: string
  name: string
  avatar?: string
  url?: string
  bio?: string
}

export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  author: Author | null
  tags: string[]
  content: string
}

export type LearnPage = {
  slug: string
  title: string
  description: string
  order: number
  content: string
}

export type LearnSection = {
  slug: string
  title: string
  description: string
  order: number
  pages: LearnPage[]
}

// ─── Helpers ─────────────────────────────────────────────────────────

function readMarkdown(filePath: string): { data: Record<string, unknown>; content: string } | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8")
    return matter(raw)
  } catch {
    return null
  }
}

function stripOrderPrefix(name: string): string {
  return name.replace(/^\d+-/, "")
}

function getOrderPrefix(name: string): number {
  const match = name.match(/^(\d+)-/)
  return match ? parseInt(match[1], 10) : 999
}

// ─── Authors ─────────────────────────────────────────────────────────

export function getAuthor(id: string): Author | null {
  const parsed = readMarkdown(path.join(contentDir, "authors", `${id}.md`))
  if (!parsed) return null
  return {
    id,
    name: (parsed.data.name as string) ?? id,
    avatar: parsed.data.avatar as string | undefined,
    url: parsed.data.url as string | undefined,
    bio: parsed.data.bio as string | undefined,
  }
}

export function getAllAuthors(): Author[] {
  const dir = path.join(contentDir, "authors")
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => getAuthor(f.replace(".md", "")))
    .filter((a): a is Author => a !== null)
}

// ─── Blog ────────────────────────────────────────────────────────────

export function getBlogPost(slug: string): BlogPost | null {
  const parsed = readMarkdown(path.join(contentDir, "blog", `${slug}.md`))
  if (!parsed) return null
  const authorId = parsed.data.author as string | undefined
  return {
    slug,
    title: (parsed.data.title as string) ?? slug,
    description: (parsed.data.description as string) ?? "",
    date: (parsed.data.date as string) ?? "",
    author: authorId ? getAuthor(authorId) : null,
    tags: (parsed.data.tags as string[]) ?? [],
    content: parsed.content,
  }
}

export function getAllBlogPosts(): BlogPost[] {
  const dir = path.join(contentDir, "blog")
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => getBlogPost(f.replace(".md", "")))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (b.date > a.date ? 1 : -1))
}

export function getAllBlogTags(): string[] {
  const tags = new Set<string>()
  for (const post of getAllBlogPosts()) {
    for (const tag of post.tags) tags.add(tag)
  }
  return [...tags].sort()
}

// ─── Learn ───────────────────────────────────────────────────────────

export function getLearnSection(sectionSlug: string): LearnSection | null {
  const sectionDir = path.join(contentDir, "learn")
  if (!fs.existsSync(sectionDir)) return null

  const dirs = fs.readdirSync(sectionDir, { withFileTypes: true }).filter((d) => d.isDirectory())
  const match = dirs.find((d) => stripOrderPrefix(d.name) === sectionSlug)
  if (!match) return null

  const fullDir = path.join(sectionDir, match.name)
  const indexParsed = readMarkdown(path.join(fullDir, "index.md"))

  const pages = fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => {
      const parsed = readMarkdown(path.join(fullDir, f))
      if (!parsed) return null
      const pageSlug = stripOrderPrefix(f.replace(".md", ""))
      return {
        slug: pageSlug,
        title: (parsed.data.title as string) ?? pageSlug,
        description: (parsed.data.description as string) ?? "",
        order: getOrderPrefix(f),
        content: parsed.content,
      } satisfies LearnPage
    })
    .filter((p): p is LearnPage => p !== null)
    .sort((a, b) => a.order - b.order)

  return {
    slug: sectionSlug,
    title: (indexParsed?.data.title as string) ?? sectionSlug,
    description: (indexParsed?.data.description as string) ?? "",
    order: getOrderPrefix(match.name),
    pages,
  }
}

export function getAllLearnSections(): LearnSection[] {
  const dir = path.join(contentDir, "learn")
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => getLearnSection(stripOrderPrefix(d.name)))
    .filter((s): s is LearnSection => s !== null)
    .sort((a, b) => a.order - b.order)
}

export function getLearnPage(sectionSlug: string, pageSlug: string): { section: LearnSection; page: LearnPage } | null {
  const section = getLearnSection(sectionSlug)
  if (!section) return null
  const page = section.pages.find((p) => p.slug === pageSlug)
  if (!page) return null
  return { section, page }
}
