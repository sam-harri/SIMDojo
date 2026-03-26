import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { HeaderAuth } from "./header-auth"

export async function Header() {
  const { userId } = await auth()

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image src="/logo.svg" alt="simdojo" width={64} height={64} className="size-7" />
          <span className="font-brand text-lg font-bold tracking-tight text-foreground">
            SIMDojo
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Problems
            </Button>
          </Link>
          {userId && (
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Profile
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <HeaderAuth />
        </div>
      </div>
    </header>
  )
}
