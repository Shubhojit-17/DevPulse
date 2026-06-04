"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="absolute inset-0 -z-10 bg-hero-gradient" />
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            DP
          </span>
          DevPulse
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Connect GitHub</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to connect repositories and start tracking delivery metrics.
        </p>
        <Button className="mt-6 w-full" onClick={() => signIn('github', { callbackUrl: '/dashboard' })}>
          Continue with GitHub
        </Button>
      </div>
    </div>
  );
}
