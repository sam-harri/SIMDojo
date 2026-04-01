import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/sso-callback/"],
    },
    sitemap: "https://simdojo.dev/sitemap.xml",
  }
}
