import type { Metadata } from "next"
import { DM_Sans, Space_Mono, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ui } from "@clerk/ui"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Header } from "@/components/layout/header"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const spaceMono = Space_Mono({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const DESCRIPTION = "Practice AVX2 SIMD programming with interactive challenges. Master Intel intrinsics through hands-on coding challenges."

export const metadata: Metadata = {
  metadataBase: new URL("https://simdojo.dev"),
  title: {
    default: "simdojo",
    template: "%s — simdojo",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "simdojo",
    title: "simdojo — AVX2 SIMD Challenge Platform",
    description: DESCRIPTION,
    url: "https://simdojo.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "simdojo — AVX2 SIMD Challenge Platform",
    description: DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceMono.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('simdojo-theme') || 'dark';
                if (theme === 'dark') document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body className="flex h-full flex-col overflow-hidden antialiased">
        <ClerkProvider ui={ui}>
          <ThemeProvider>
            <TooltipProvider>
              <Header />
              <main className="min-h-0 flex-1 overflow-auto">{children}</main>
            </TooltipProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
