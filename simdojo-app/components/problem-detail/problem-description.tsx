"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { HintBlock } from "./hint-block"

interface ProblemDescriptionProps {
  markdown: string
}

/**
 * Parses custom :::hint{title="..."} ... ::: blocks out of the markdown,
 * splitting the content into segments of plain markdown and hint blocks.
 */
function parseSegments(
  md: string
): Array<{ type: "markdown"; content: string } | { type: "hint"; title: string; content: string }> {
  const segments: Array<
    { type: "markdown"; content: string } | { type: "hint"; title: string; content: string }
  > = []

  const hintRegex = /:::hint\{title="([^"]+)"\}\s*\n([\s\S]*?):::/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = hintRegex.exec(md)) !== null) {
    // Text before this hint
    if (match.index > lastIndex) {
      const before = md.slice(lastIndex, match.index).trim()
      if (before) segments.push({ type: "markdown", content: before })
    }
    segments.push({
      type: "hint",
      title: match[1],
      content: match[2].trim(),
    })
    lastIndex = match.index + match[0].length
  }

  // Remaining text
  const remaining = md.slice(lastIndex).trim()
  if (remaining) segments.push({ type: "markdown", content: remaining })

  return segments
}

function MarkdownRenderer({ content }: { content: string }) {
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
            <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-sm text-foreground">
              {children}
            </pre>
          )
        },
        h1({ children }) {
          return <h1 className="mb-4 text-2xl font-bold tracking-tight">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="mb-3 mt-6 text-xl font-semibold tracking-tight">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="mb-2 mt-4 text-lg font-semibold">{children}</h3>
        },
        p({ children }) {
          return <p className="mb-3 leading-relaxed">{children}</p>
        },
        ul({ children }) {
          return <ul className="mb-3 list-disc space-y-1 pl-6">{children}</ul>
        },
        ol({ children }) {
          return <ol className="mb-3 list-decimal space-y-1 pl-6">{children}</ol>
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>
        },
        table({ children }) {
          return (
            <div className="mb-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          )
        },
        th({ children }) {
          return (
            <th className="border border-border bg-muted px-3 py-1.5 text-left font-semibold">
              {children}
            </th>
          )
        },
        td({ children }) {
          return <td className="border border-border px-3 py-1.5">{children}</td>
        },
        blockquote({ children }) {
          return (
            <blockquote className="mb-3 border-l-2 border-primary pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export function ProblemDescription({ markdown }: ProblemDescriptionProps) {
  const segments = parseSegments(markdown)

  return (
    <div className="prose-sm max-w-none space-y-4 text-foreground">
      {segments.map((segment, i) => {
        if (segment.type === "hint") {
          return (
            <HintBlock key={i} title={segment.title}>
              <MarkdownRenderer content={segment.content} />
            </HintBlock>
          )
        }
        return <MarkdownRenderer key={i} content={segment.content} />
      })}
    </div>
  )
}
