import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllLearnSections, getLearnPage } from "@/lib/content"
import { extractHeadings } from "@/lib/content-utils"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { TableOfContents } from "@/components/table-of-contents"
import { LearnSidebar } from "@/components/learn/sidebar"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"

export function generateStaticParams() {
  const sections = getAllLearnSections()
  const params: { section: string; page: string }[] = []
  for (const section of sections) {
    for (const page of section.pages) {
      params.push({ section: section.slug, page: page.slug })
    }
  }
  return params
}

export default async function LearnPageRoute({
  params,
}: {
  params: Promise<{ section: string; page: string }>
}) {
  const { section: sectionSlug, page: pageSlug } = await params
  const result = getLearnPage(sectionSlug, pageSlug)
  if (!result) notFound()

  const { section, page } = result
  const allSections = getAllLearnSections()
  const headings = extractHeadings(page.content)

  const pageIdx = section.pages.findIndex((p) => p.slug === page.slug)
  const prevPage = pageIdx > 0 ? section.pages[pageIdx - 1] : null
  const nextPage = pageIdx < section.pages.length - 1 ? section.pages[pageIdx + 1] : null

  const sectionIdx = allSections.findIndex((s) => s.slug === section.slug)
  const prevSection = sectionIdx > 0 ? allSections[sectionIdx - 1] : null
  const nextSection = sectionIdx < allSections.length - 1 ? allSections[sectionIdx + 1] : null

  const prevLink = prevPage
    ? { href: `/learn/${section.slug}/${prevPage.slug}`, label: prevPage.title }
    : prevSection && prevSection.pages.length > 0
      ? { href: `/learn/${prevSection.slug}/${prevSection.pages[prevSection.pages.length - 1].slug}`, label: prevSection.pages[prevSection.pages.length - 1].title }
      : null

  const nextLink = nextPage
    ? { href: `/learn/${section.slug}/${nextPage.slug}`, label: nextPage.title }
    : nextSection && nextSection.pages.length > 0
      ? { href: `/learn/${nextSection.slug}/${nextSection.pages[0].slug}`, label: nextSection.pages[0].title }
      : null

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 xl:grid-cols-[240px_1fr_220px]">
      {/* Left sidebar -- learn tree */}
      <LearnSidebar sections={allSections} currentSection={section.slug} currentPage={page.slug} />

      {/* Center -- article content */}
      <main className="min-w-0">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="size-3" />
          All sections
        </Link>

        <header className="mt-6 lg:mt-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {section.title}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{page.title}</h1>
          {page.description && (
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">{page.description}</p>
          )}
          <hr className="mt-6 border-border/60" />
        </header>

        <article className="mt-8">
          <MarkdownRenderer content={page.content} />
        </article>

        {/* Prev / Next navigation */}
        <nav className="mt-12 flex items-stretch gap-3">
          {prevLink ? (
            <Link
              href={prevLink.href}
              className="group flex flex-1 items-center gap-2 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/[0.06] transition-all hover:ring-foreground/[0.12]"
            >
              <ChevronLeft className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Previous</p>
                <p className="truncate text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  {prevLink.label}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextLink ? (
            <Link
              href={nextLink.href}
              className="group flex flex-1 items-center justify-end gap-2 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/[0.06] transition-all hover:ring-foreground/[0.12]"
            >
              <div className="min-w-0 text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Next</p>
                <p className="truncate text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  {nextLink.label}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      </main>

      {/* Right sidebar -- table of contents */}
      <TableOfContents headings={headings} />
    </div>
  )
}
