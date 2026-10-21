"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Check } from "lucide-react";
import { logger } from "@/lib/logger";

const features = [
  "Unlimited daily meal logging",
  "Track calories & macros",
  "Personalized nutrition goals",
  "Full progress calendar access",
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string>("FREE");
  const [isFetchingPlan, setIsFetchingPlan] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      axios.get("/api/profile").then((res) => {
        if (res.data.subscription?.plan) {
          setPlan(res.data.subscription.plan);
        }
      }).catch((error) => {
        logger.error({ err: error }, "Failed to fetch profile");
      }).finally(() => {
        setIsFetchingPlan(false);
      });
    } else if (session === null) {
      const timer = setTimeout(() => {
        setIsFetchingPlan(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session]);

  const isPro = plan === "PRO";

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/checkout");
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      logger.error({ err: error }, "Subscription error");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/checkout/portal");
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      logger.error({ err: error }, "Portal error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[85vh] flex-1 flex-col items-center overflow-hidden bg-canvas px-4 py-12 text-ink selection:bg-highlight selection:text-ink md:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      {/* Title Area */}
      <div className="relative mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Subscription</h1>
      </div>

      {/* Subscription Card Container */}
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8">
        <div className="mb-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Pro plan</h2>
            {isPro && (
              <span className="rounded-full bg-highlight px-3 py-1 text-sm font-semibold text-ink">
                Active
              </span>
            )}
          </div>
          <p className="mt-2 text-base text-muted">Master your nutrition</p>
          <p className="mt-5 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold tracking-tight text-ink">฿199</span>
            <span className="text-sm text-muted">/ month</span>
          </p>
        </div>

        {/* Feature List */}
        <ul className="mb-8 space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-base text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {/* Action Button */}
        <div>
          <button
            onClick={isPro ? handleManageSubscription : handleSubscribe}
            disabled={loading || !session || isFetchingPlan}
            aria-busy={loading || isFetchingPlan}
            className="min-h-12 w-full cursor-pointer rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading || isFetchingPlan ? "Loading..." : (!session ? "Login required" : (isPro ? "Manage subscription" : "Upgrade to Pro"))}
          </button>

          {!session && (
            <p className="mt-4 text-center text-sm text-muted">
              Please log in to access premium features
            </p>
          )}
        </div>
      </div>
    </div>
  );
}