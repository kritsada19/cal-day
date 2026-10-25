import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout cancelled | CalDay",
  description: "Your CalDay Premium checkout was cancelled.",
};

export default function CheckoutCancelPage() {
  return (
    <div className="relative flex min-h-[85vh] flex-1 items-center overflow-hidden bg-canvas px-4 py-12 text-ink selection:bg-highlight selection:text-ink sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <section className="relative mx-auto w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-highlight text-ink">
            <CreditCard className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-medium text-muted">Checkout cancelled</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            No changes made
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted">
            Your payment was not completed and your current plan has not changed. You can return whenever you&apos;re ready.
          </p>
        </div>

        <div className="mt-8 flex gap-3 border-y border-line py-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-base leading-7 text-muted">
            Your payment details were handled securely by Stripe. No charge was made for this checkout.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/subscription"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Try again
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-tint px-5 py-3 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}