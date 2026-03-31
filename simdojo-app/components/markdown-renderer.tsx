"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { slugify } from "@/lib/content-utils"

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const isInline = !className
          if (isInline) {
            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
                {...props}
              >
                {children}
              </code>
            )
          }
          return (
            <code className={`${className ?? ""} font-mono`} {...props}>
              {children}
            </code>
          )
        },
        pre({ children }) {
          return (
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm text-foreground">
              {children}
            </pre>
          )
        },
        h1({ children }) {
          return <h1 className="mb-4 text-2xl font-bold tracking-tight">{children}</h1>
        },
        h2({ children }) {
          const text = getTextContent(children)
          const id = slugify(text)
          return (
            <h2 id={id} className="group mb-3 mt-8 scroll-mt-20 text-xl font-semibold tracking-tight">
              {children}
              <a href={`#${id}`} className="ml-2 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground">#</a>
            </h2>
          )
        },
        h3({ children }) {
          const text = getTextContent(children)
          const id = slugify(text)
          return (
            <h3 id={id} className="group mb-2 mt-5 scroll-mt-20 text-lg font-semibold">
              {children}
              <a href={`#${id}`} className="ml-2 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground">#</a>
            </h3>
          )
        },
        p({ children }) {
          return <p className="mb-3 leading-relaxed text-foreground/85">{children}</p>
        },
        strong({ children }) {
          return <strong className="font-semibold text-foreground">{children}</strong>
        },
        a({ href, children }) {
          return (
            <a href={href} className="font-medium text-primary underline underline-offset-3 hover:text-primary/80">
              {children}
            </a>
          )
        },
        ul({ children }) {
          return <ul className="mb-3 list-disc space-y-1 pl-6 text-foreground/85">{children}</ul>
        },
        ol({ children }) {
          return <ol className="mb-3 list-decimal space-y-1 pl-6 text-foreground/85">{children}</ol>
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>
        },
        table({ children }) {
          return (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          )
        },
        th({ children }) {
          return (
            <th className="border-b border-border bg-muted px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {children}
            </th>
          )
        },
        td({ children }) {
          return <td className="border-b border-border/50 px-3 py-2 font-mono text-sm">{children}</td>
        },
        blockquote({ children }) {
          return (
            <blockquote className="my-4 border-l-2 border-primary/40 pl-4 text-muted-foreground italic">
              {children}
            </blockquote>
          )
        },
        hr() {
          return <hr className="my-8 border-border/60" />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function getTextContent(children: React.ReactNode): string {
  if (typeof children === "string") return children
  if (typeof children === "number") return String(children)
  if (Array.isArray(children)) return children.map(getTextContent).join("")
  if (children && typeof children === "object" && "props" in children) {
    return getTextContent((children as React.ReactElement<{ children?: React.ReactNode }>).props.children)
  }
  return ""
}
