"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { HeaderAuth } from "./header-auth"
import { Menu } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Problems" },
  { href: "/reference", label: "Reference" },
  { href: "/learn", label: "Learn" },
  { href: "/blog", label: "Blog" },
]

function DesktopNavLinks({ isSignedIn }: { isSignedIn?: boolean }) {
  const pathname = usePathname()

  return (
    <>
      {navLinks.map(({ href, label }) => (
        <Link key={href} href={href}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              pathname === href && "text-foreground"
            )}
          >
            {label}
          </Button>
        </Link>
      ))}
      {isSignedIn && (
        <Link href="/profile">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-muted-foreground hover:text-foreground",
              pathname === "/profile" && "text-foreground"
            )}
          >
            Profile
          </Button>
        </Link>
      )}
    </>
  )
}

function MobileDrawer({ isSignedIn, open, onOpenChange }: {
  isSignedIn?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const pathname = usePathname()
  const close = () => onOpenChange(false)

  const allLinks = [
    ...navLinks,
    ...(isSignedIn ? [{ href: "/profile", label: "Profile" }] : []),
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="sm:hidden -mr-1" />}
      >
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="max-w-[210px] gap-0 p-0 border-l border-border/50 bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border/40 shrink-0">
          <Image src="/logo.svg" alt="simdojo" width={64} height={64} className="size-6 opacity-90" />
          <span className="font-brand text-base font-bold tracking-tight text-foreground">
            SIMDojo
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col py-2 flex-1 overflow-y-auto">
          {allLinks.map(({ href, label }, i) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "group relative flex items-center gap-3 border-l-2 px-4 py-2.5 transition-colors",
                  active
                    ? "border-l-primary text-foreground bg-primary/[0.06]"
                    : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-l-border"
                )}
              >
                <span className={cn(
                  "font-mono text-[10px] tabular-nums transition-colors shrink-0",
                  active ? "text-primary/70" : "text-muted-foreground/30 group-hover:text-muted-foreground/50"
                )}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Auth footer */}
        <div className="shrink-0 border-t border-border/40 px-3 py-3">
          <HeaderAuth />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Header() {
  const { isSignedIn } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image src="/logo.svg" alt="simdojo" width={64} height={64} className="size-7" />
          <span className="font-brand text-lg font-bold tracking-tight text-foreground">
            SIMDojo
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5">
          <DesktopNavLinks isSignedIn={isSignedIn} />
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <div className="hidden sm:flex">
            <HeaderAuth />
          </div>
          <MobileDrawer isSignedIn={isSignedIn} open={open} onOpenChange={setOpen} />
        </div>
      </div>
    </header>
  )
}
