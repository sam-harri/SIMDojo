import Link from "next/link"
import { getAllLearnSections } from "@/lib/content"
import { BookOpen, ChevronRight } from "lucide-react"

export default function LearnPage() {
  const sections = getAllLearnSections()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-10">
      <h1 className="text-2xl font-bold tracking-tight">Learn SIMD</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        A structured guide to SIMD programming with AVX2, from the basics to advanced techniques
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {sections.map((section, sectionIdx) => (
          <section key={section.slug}>
            <div className="flex items-center gap-3 mb-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-brand text-xs font-bold text-primary">
                {sectionIdx + 1}
              </span>
              <div>
                <h2 className="font-semibold tracking-tight">{section.title}</h2>
                {section.description && (
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                )}
              </div>
            </div>

            <div className="ml-3.5 flex flex-col gap-1 border-l-2 border-border pl-6">
              {section.pages.map((page, pageIdx) => (
                <Link
                  key={page.slug}
                  href={`/learn/${section.slug}/${page.slug}`}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-card hover:ring-1 hover:ring-foreground/[0.06]"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">
                    {sectionIdx + 1}.{pageIdx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                      {page.title}
                    </span>
                    {page.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {page.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        ))}

        {sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Learning content coming soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
