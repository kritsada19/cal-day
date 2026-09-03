import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout cancelled | CalDay",
  description: "Your CalDay Premium checkout was cancelled.",
};

export default function CheckoutCancelPage() {
  return (
    <div className="relative flex min-h-[85vh] flex-1 items-center overflow-hidden bg-[#f8f6f1] px-4 py-12 dark:bg-obsidian-950 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.1),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)]" />

      <section className="relative mx-auto w-full max-w-xl overflow-hidden border border-black/10 bg-white/85 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-obsidian-900/90 sm:p-10">
        <span className="absolute -top-px -left-px h-5 w-5 border-t border-l border-gold-accent" />
        <span className="absolute -bottom-px -right-px h-5 w-5 border-b border-r border-gold-accent" />
        <div className="absolute top-0 right-0 h-px w-1/2 bg-linear-to-l from-gold-accent to-transparent" />

        <div className="relative text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-gold-accent/50 bg-gold-accent/10 text-gold-accent">
            <CreditCard className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="mt-7 font-mono text-[10px] tracking-[0.35em] text-gold-accent uppercase">
            Checkout cancelled
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0.15em] text-obsidian-950 dark:text-white sm:text-4xl">
            NO CHANGES MADE
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-obsidian-950/65 dark:text-white/65">
            Your payment was not completed and your current plan has not changed. You can return whenever you&apos;re ready.
          </p>
        </div>

        <div className="relative mt-8 flex gap-3 border-y border-black/10 py-5 dark:border-white/10">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-accent" aria-hidden="true" />
          <p className="text-sm leading-6 text-obsidian-950/65 dark:text-white/65">
            Your payment details were handled securely by Stripe. No charge was made for this checkout.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/subscription"
            className="inline-flex items-center justify-center border border-gold-accent bg-gold-accent px-5 py-3.5 text-xs font-bold tracking-[0.18em] text-obsidian-950 transition-colors hover:bg-gold-400"
          >
            TRY AGAIN
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 border border-black/10 bg-black/5 px-5 py-3.5 text-xs font-bold tracking-[0.18em] text-obsidian-950/75 transition-colors hover:border-gold-accent/50 hover:text-gold-accent dark:border-white/10 dark:bg-obsidian-950 dark:text-white/75"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            DASHBOARD
          </Link>
        </div>
      </section>
    </div>
  );
}
