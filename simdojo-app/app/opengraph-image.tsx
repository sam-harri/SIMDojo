import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

async function loadSpaceMonoBold(): Promise<ArrayBuffer> {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Space+Mono:wght@700",
    { cache: "force-cache" }
  ).then((r) => r.text())
  const url = css.match(/url\(([^)]+)\)/)?.[1]
  if (!url) throw new Error("Could not parse Space Mono font URL")
  return fetch(url, { cache: "force-cache" }).then((r) => r.arrayBuffer())
}

export default async function Image() {
  const [fontData, logoBuffer] = await Promise.all([
    loadSpaceMonoBold(),
    Promise.resolve(readFileSync(join(process.cwd(), "public", "logo.png"))),
  ])

  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          background: "#19191c",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          fontFamily: '"Space Mono"',
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={72} height={72} alt="" />
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#e2dfd8",
              letterSpacing: "-1px",
            }}
          >
            simdojo
          </span>
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 120,
            height: 4,
            background: "#92b577",
            borderRadius: 2,
            marginTop: 44,
            marginBottom: 36,
          }}
        />

        {/* Tagline */}
        <div style={{ fontSize: 34, color: "#e2dfd8", fontWeight: 700 }}>
          AVX2 SIMD Challenge Platform
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#706c67",
            marginTop: 16,
            fontWeight: 400,
          }}
        >
          Master intrinsics through hands-on programming challenges
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Space Mono", data: fontData, weight: 700 }],
    }
  )
}
