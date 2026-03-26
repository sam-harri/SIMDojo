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

export const metadata: Metadata = {
  title: "simdojo — SIMD Challenge Platform",
  description: "Practice AVX2 SIMD programming with interactive challenges",
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
      <body className="flex min-h-full flex-col antialiased">
        <ClerkProvider ui={ui}>
          <ThemeProvider>
            <TooltipProvider>
              <Header />
              <main className="flex-1">{children}</main>
            </TooltipProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
