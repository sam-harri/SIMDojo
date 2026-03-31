import Link from "next/link"
import Image from "next/image"
import { getAllBlogPosts, getAllBlogTags } from "@/lib/content"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"

export default function BlogPage() {
  const posts = getAllBlogPosts()
  const allTags = getAllBlogTags()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-10">
      <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Articles, tutorials, and updates from the SIMDojo community
      </p>

      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <article className="group rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/[0.06] transition-all hover:ring-foreground/[0.12]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {post.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    {post.author && (
                      <div className="flex items-center gap-1.5">
                        {post.author.avatar && (
                          <Image
                            src={post.author.avatar}
                            alt={post.author.name}
                            width={18}
                            height={18}
                            className="rounded-full"
                          />
                        )}
                        <span className="text-xs font-medium text-muted-foreground">
                          {post.author.name}
                        </span>
                      </div>
                    )}
                    {post.date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                        <CalendarDays className="size-3" />
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </div>
                    )}
                    {post.tags.length > 0 && (
                      <div className="flex gap-1">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}

        {posts.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No posts yet.</p>
        )}
      </div>
    </div>
  )
}
