import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"
import { db } from "@/lib/db"
import { problem } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: "#1e3320", text: "#92b577" },
  medium: { bg: "#332a10", text: "#f0b040" },
  hard: { bg: "#331515", text: "#f87171" },
}

async function loadSpaceMonoBold(): Promise<ArrayBuffer> {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Space+Mono:wght@700",
    { cache: "force-cache" }
  ).then((r) => r.text())
  const url = css.match(/url\(([^)]+)\)/)?.[1]
  if (!url) throw new Error("Could not parse Space Mono font URL")
  return fetch(url, { cache: "force-cache" }).then((r) => r.arrayBuffer())
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function Image({ params }: Props) {
  const { id } = await params

  const [fontData, logoBuffer, problemRow] = await Promise.all([
    loadSpaceMonoBold(),
    Promise.resolve(readFileSync(join(process.cwd(), "public", "logo.png"))),
    db
      .select({ title: problem.title, difficulty: problem.difficulty, sortOrder: problem.sortOrder })
      .from(problem)
      .where(eq(problem.slug, id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ])

  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`
  const title = problemRow?.title ?? "Challenge"
  const difficulty = problemRow?.difficulty ?? "easy"
  const sortOrder = problemRow?.sortOrder ?? 0
  const diffColor = DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.easy

  return new ImageResponse(
    (
      <div
        style={{
          background: "#19191c",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 90px",
          fontFamily: '"Space Mono"',
        }}
      >
        {/* Header: wordmark + difficulty */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={40} height={40} alt="" />
            <span style={{ fontSize: 28, fontWeight: 700, color: "#706c67" }}>
              simdojo
            </span>
          </div>
          <div
            style={{
              background: diffColor.bg,
              color: diffColor.text,
              fontSize: 22,
              fontWeight: 700,
              padding: "8px 20px",
              borderRadius: 8,
              textTransform: "capitalize",
            }}
          >
            {difficulty}
          </div>
        </div>

        {/* Problem number + title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            marginBottom: "auto",
          }}
        >
          <div
            style={{ fontSize: 26, color: "#706c67", fontWeight: 700, marginBottom: 16 }}
          >
            {String(sortOrder).padStart(3, "0")}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#e2dfd8",
              letterSpacing: "-1px",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer accent */}
        <div
          style={{
            width: "100%",
            height: 3,
            background: "#92b577",
            borderRadius: 2,
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Space Mono", data: fontData, weight: 700 }],
    }
  )
}
