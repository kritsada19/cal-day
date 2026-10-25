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
    <div className="relative flex min-h-[85vh] flex-1 items-center overflow-hidden bg-canvas px-4 py-12 text-ink selection:bg-highlight selection:text-ink sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/50 blur-3xl"
      />

      <section className="relative mx-auto w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint text-primary">
            <CircleCheck className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-medium text-muted">Checkout complete</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Welcome to Premium
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted">
            Your subscription is being activated. Premium features will be available as soon as your payment confirmation finishes syncing.
          </p>
        </div>

        <ul className="mt-8 space-y-3 border-y border-line py-5">
          <li className="flex items-center gap-3 text-base text-ink">
            <Check className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
            <span>Unlimited meal logging and personalised insights</span>
          </li>
          <li className="flex items-center gap-3 text-base text-ink">
            <Check className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
            <span>Advanced analytics and custom macro targets</span>
          </li>
        </ul>

        {checkoutReference && (
          <p className="mt-5 text-center text-sm text-muted">
            Confirmation reference - <span className="font-mono tracking-wider">{checkoutReference}</span>
          </p>
        )}

        <Link
          href="/dashboard"
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}