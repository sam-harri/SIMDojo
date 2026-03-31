import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getAllBlogPosts, getBlogPost } from "@/lib/content"
import { extractHeadings } from "@/lib/content-utils"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { TableOfContents } from "@/components/table-of-contents"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CalendarDays, ExternalLink } from "lucide-react"

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }))
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const headings = extractHeadings(post.content)

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 xl:grid xl:grid-cols-[240px_1fr_220px] xl:gap-8">
      {/* Left spacer to center content */}
      <div className="hidden xl:block" />

      {/* Main content */}
      <main className="min-w-0 max-w-3xl mx-auto xl:mx-0">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          All posts
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
          {post.description && (
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{post.description}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.avatar && (
                  <Image
                    src={post.author.avatar}
                    alt={post.author.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{post.author.name}</span>
                  {post.author.url && (
                    <a
                      href={post.author.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
            {post.date && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="mt-3 flex gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <hr className="mt-6 border-border/60" />
        </header>

        <article className="mt-8">
          <MarkdownRenderer content={post.content} />
        </article>
      </main>

      {/* Right sidebar -- table of contents */}
      <TableOfContents headings={headings} />
    </div>
  )
}
