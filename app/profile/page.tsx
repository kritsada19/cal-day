"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const displayName = session?.user?.name || session?.user?.email || "UNNAMED OPERATOR";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 relative overflow-hidden bg-obsidian-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="mx-auto max-w-5xl relative">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.35em] text-gold-accent font-mono uppercase">
              PROFILE ACCESS
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[0.2em] text-white">
              OPERATOR PROFILE
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-white/10 bg-obsidian-900 px-4 py-2 text-[10px] font-semibold tracking-[0.25em] text-white/70 transition-all duration-300 hover:border-gold-accent/50 hover:text-gold-accent"
          >
            RETURN TO DASHBOARD
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6 shadow-glow-gold md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_45%)] pointer-events-none" />
            <span className="absolute -top-px -left-px h-3 w-3 border-l border-t border-gold-accent" />
            <span className="absolute -top-px -right-px h-3 w-3 border-r border-t border-gold-accent" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b border-l border-gold-accent" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b border-r border-gold-accent" />

            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex h-24 w-24 items-center justify-center border border-gold-accent/50 bg-obsidian-950 text-3xl font-bold text-gold-accent">
                {status === "loading" ? "..." : initials}
              </div>

              <div className="flex-1">
                <p className="text-[10px] tracking-[0.35em] text-white/45 font-mono uppercase">
                  PROFILE STATUS
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[0.18em] text-white">
                  {status === "loading" ? "LOADING PROFILE" : displayName}
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  {session?.user?.email || "Authenticate to unlock your secure profile dashboard."}
                </p>
                <div className="mt-4 inline-flex border border-emerald-accent/30 bg-emerald-glow px-3 py-1 text-[10px] font-semibold tracking-[0.25em] text-emerald-accent uppercase">
                  ACTIVE ELITE ACCESS
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="border border-white/10 bg-obsidian-950 p-4">
                <p className="text-[9px] tracking-[0.3em] text-white/40 font-mono uppercase">Member class</p>
                <p className="mt-2 text-sm font-semibold text-gold-accent">PRO ELITE</p>
              </div>
              <div className="border border-white/10 bg-obsidian-950 p-4">
                <p className="text-[9px] tracking-[0.3em] text-white/40 font-mono uppercase">Access level</p>
                <p className="mt-2 text-sm font-semibold text-white">Full dashboard</p>
              </div>
              <div className="border border-white/10 bg-obsidian-950 p-4">
                <p className="text-[9px] tracking-[0.3em] text-white/40 font-mono uppercase">Security</p>
                <p className="mt-2 text-sm font-semibold text-white">Encrypted session</p>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6">
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

              <p className="text-[10px] tracking-[0.3em] text-white/40 font-mono uppercase">Account snapshot</p>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-white/45">USER ID</span>
                  <span className="font-semibold text-white">{session?.user?.id ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-white/45">ROLE</span>
                  <span className="font-semibold text-white">{session?.user?.role || "USER"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/45">AUTH</span>
                  <span className="font-semibold text-white">NEXT AUTH</span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6">
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

              {status === "authenticated" ? (
                <>
                  <p className="text-[10px] tracking-[0.3em] text-white/40 font-mono uppercase">Quick actions</p>
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full border border-gold-accent/40 bg-obsidian-950 px-4 py-3 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/10 hover:text-white"
                    >
                      SIGN OUT
                    </button>
                    <Link
                      href="/"
                      className="flex w-full items-center justify-center border border-white/10 bg-obsidian-950 px-4 py-3 text-[10px] font-semibold tracking-[0.25em] text-white/70 transition-all duration-300 hover:border-white/25 hover:text-white"
                    >
                      VIEW DASHBOARD
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] tracking-[0.3em] text-white/40 font-mono uppercase">Session required</p>
                  <p className="mt-3 text-sm text-white/60">
                    Please sign in to view your secure profile and manage your account.
                  </p>
                  <Link
                    href="/signin"
                    className="mt-4 inline-flex w-full items-center justify-center border border-gold-accent/40 bg-obsidian-950 px-4 py-3 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/10 hover:text-white"
                  >
                    SIGN IN
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
