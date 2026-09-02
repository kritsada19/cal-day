import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Subscription activated | CalDay",
  description: "Your CalDay Premium checkout is complete.",
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;
  const checkoutReference = typeof sessionId === "string" ? sessionId.slice(-8).toUpperCase() : null;

  return (
    <div className="relative flex min-h-[85vh] flex-1 items-center overflow-hidden bg-[#f8f6f1] px-4 py-12 dark:bg-obsidian-950 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,223,137,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.1),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)]" />

      <section className="relative mx-auto w-full max-w-xl overflow-hidden border border-emerald-accent/30 bg-white/85 p-6 shadow-glow-emerald backdrop-blur-sm dark:bg-obsidian-900/90 sm:p-10">
        <span className="absolute -top-px -left-px h-5 w-5 border-t border-l border-emerald-accent" />
        <span className="absolute -top-px -right-px h-5 w-5 border-t border-r border-emerald-accent" />
        <span className="absolute -bottom-px -left-px h-5 w-5 border-b border-l border-emerald-accent" />
        <span className="absolute -right-px -bottom-px h-5 w-5 border-r border-b border-emerald-accent" />

        <div className="absolute top-0 right-0 h-px w-1/2 bg-linear-to-l from-emerald-accent to-transparent" />

        <div className="relative text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-emerald-accent/50 bg-emerald-accent/10 text-emerald-accent shadow-glow-emerald">
            <CircleCheck className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="mt-7 font-mono text-[10px] tracking-[0.35em] text-emerald-accent uppercase">
            Checkout complete
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0.15em] text-obsidian-950 dark:text-white sm:text-4xl">
            WELCOME TO PREMIUM
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-obsidian-950/65 dark:text-white/65">
            Your subscription is being activated. Premium features will be available as soon as your payment confirmation finishes syncing.
          </p>
        </div>

        <div className="relative mt-8 border-y border-black/10 py-5 dark:border-white/10">
          <div className="flex items-center gap-3 text-sm text-obsidian-950/75 dark:text-white/75">
            <Check className="h-4 w-4 shrink-0 text-emerald-accent" aria-hidden="true" />
            <span>Unlimited meal logging and personalised insights</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm text-obsidian-950/75 dark:text-white/75">
            <Check className="h-4 w-4 shrink-0 text-emerald-accent" aria-hidden="true" />
            <span>Advanced analytics and custom macro targets</span>
          </div>
        </div>

        {checkoutReference && (
          <p className="mt-5 text-center font-mono text-[9px] tracking-[0.2em] text-obsidian-950/40 uppercase dark:text-white/40">
            Confirmation reference - {checkoutReference}
          </p>
        )}

        <Link
          href="/dashboard"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 border border-gold-accent bg-gold-accent px-5 py-3.5 text-xs font-bold tracking-[0.2em] text-obsidian-950 transition-colors hover:bg-gold-400"
        >
          GO TO DASHBOARD
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
