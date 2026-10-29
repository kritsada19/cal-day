"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

type VerifyStatus = "success" | "already" | "expired" | "invalid" | "error";
type Tone = "success" | "notice" | "danger";

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  tone: Tone;
  linkText: string;
  linkHref: string;
}

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-primary-tint text-primary",
  notice: "bg-highlight text-ink",
  danger: "bg-danger/10 text-danger",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function VerifyEmailContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status") || "error";

  const STATUS_MAP: Record<VerifyStatus, StatusConfig> = {
    success: {
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t("verifyTitle"),
      subtitle: t("verifySubtitle"),
      description: t("verifyDescription"),
      tone: "success",
      linkText: t("verifyAction"),
      linkHref: "/signin",
    },
    already: {
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t("alreadyVerifiedTitle"),
      subtitle: t("alreadyVerifiedSubtitle"),
      description: t("alreadyVerifiedDescription"),
      tone: "success",
      linkText: t("verifyAction"),
      linkHref: "/signin",
    },
    expired: {
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: t("expiredTitle"),
      subtitle: t("expiredSubtitle"),
      description: t("expiredDescription"),
      tone: "notice",
      linkText: t("expiredAction"),
      linkHref: "/signup",
    },
    invalid: {
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      title: t("invalidTitle"),
      subtitle: t("invalidSubtitle"),
      description: t("invalidDescription"),
      tone: "danger",
      linkText: t("expiredAction"),
      linkHref: "/signup",
    },
    error: {
      icon: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      title: t("errorTitle"),
      subtitle: t("errorSubtitle"),
      description: t("errorDescription"),
      tone: "danger",
      linkText: t("errorAction"),
      linkHref: "/",
    },
  };

  const status: VerifyStatus = (rawStatus in STATUS_MAP ? rawStatus : "error") as VerifyStatus;
  const config = STATUS_MAP[status];

  return (
    <div className="relative flex min-h-[85vh] flex-1 items-center justify-center overflow-hidden bg-canvas px-4 py-10 text-ink selection:bg-highlight selection:text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/50 blur-3xl"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8 md:p-10">
        <div className="mb-6 flex select-none flex-col items-center text-center">
          <span className="text-lg font-bold tracking-tight text-ink">CALDAY</span>

          <div
            className={`mt-6 flex h-16 w-16 items-center justify-center rounded-full ${TONE_CLASS[config.tone]}`}
          >
            {config.icon}
          </div>
        </div>

        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {config.title}
          </h1>
          <p className="text-base font-medium text-ink">{config.subtitle}</p>
          <p className="text-base leading-7 text-muted">
            {config.description}
          </p>
        </div>

        <Link
          href={config.linkHref}
          className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`}
        >
          {config.linkText}
        </Link>

        <div className="mt-8 border-t border-line pt-6 text-center">
          <span className="text-sm text-muted">
            CalDay — small steps, healthier days
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas">
        <div role="status">
          <span className="sr-only">Loading...</span>
          <div
            aria-hidden="true"
            className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none"
          />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}