"use client"

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function HeaderAuth() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return <UserButton />
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button size="sm">
          Sign up
        </Button>
      </SignUpButton>
    </div>
  )
}
