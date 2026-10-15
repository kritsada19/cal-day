"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

type VerifyStatus = "success" | "already" | "expired" | "invalid" | "error";

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  linkText: string;
  linkHref: string;
}

const STATUS_MAP: Record<VerifyStatus, StatusConfig> = {
  success: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "EMAIL VERIFIED",
    subtitle: "Your account is now active",
    description: "Your email has been successfully verified. You can now sign in and start tracking your nutrition with CalDay.",
    accentColor: "text-emerald-accent",
    glowColor: "shadow-glow-emerald",
    borderColor: "border-emerald-accent",
    linkText: "SIGN IN TO YOUR ACCOUNT",
    linkHref: "/signin",
  },
  already: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "ALREADY VERIFIED",
    subtitle: "No action needed",
    description: "This email address has already been verified. You can sign in to your CalDay account right away.",
    accentColor: "text-gold-accent",
    glowColor: "shadow-glow-gold",
    borderColor: "border-gold-accent",
    linkText: "SIGN IN TO YOUR ACCOUNT",
    linkHref: "/signin",
  },
  expired: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "LINK EXPIRED",
    subtitle: "Verification token has expired",
    description: "This verification link has expired. Please sign up again or request a new verification email.",
    accentColor: "text-gold-400",
    glowColor: "shadow-glow-gold",
    borderColor: "border-gold-400",
    linkText: "CREATE A NEW ACCOUNT",
    linkHref: "/signup",
  },
  invalid: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    title: "INVALID LINK",
    subtitle: "Verification token not recognized",
    description: "This verification link is invalid or has already been used. Please try signing up again.",
    accentColor: "text-gold-400",
    glowColor: "shadow-glow-gold",
    borderColor: "border-gold-400",
    linkText: "CREATE A NEW ACCOUNT",
    linkHref: "/signup",
  },
  error: {
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "SOMETHING WENT WRONG",
    subtitle: "We couldn't verify your email",
    description: "An unexpected error occurred while verifying your email. Please try again later or contact support.",
    accentColor: "text-gold-400",
    glowColor: "shadow-glow-gold",
    borderColor: "border-gold-400",
    linkText: "GO TO HOMEPAGE",
    linkHref: "/",
  },
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status") || "error";
  const status: VerifyStatus = (rawStatus in STATUS_MAP ? rawStatus : "error") as VerifyStatus;
  const config = STATUS_MAP[status];

  const isSuccess = status === "success" || status === "already";

  return (
    <div className="min-h-[85vh] flex-1 flex items-center justify-center px-4 relative overflow-hidden bg-[#f8f6f1] dark:bg-obsidian-950">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Success-specific green radial glow */}
      {isSuccess && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,223,137,0.05),transparent_60%)] pointer-events-none animate-pulse" />
      )}

      {/* Main Card */}
      <div className={`max-w-md w-full bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-8 md:p-10 ${config.glowColor} relative overflow-hidden`}>
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 h-px w-full ${isSuccess ? "bg-linear-to-r from-transparent via-emerald-accent to-transparent" : "bg-linear-to-r from-transparent via-gold-accent to-transparent"}`} />

        {/* Corner Brackets */}
        <span className={`absolute -top-px -left-px w-2.5 h-2.5 border-t border-l ${config.borderColor}`} />
        <span className={`absolute -top-px -right-px w-2.5 h-2.5 border-t border-r ${config.borderColor}`} />
        <span className={`absolute -bottom-px -left-px w-2.5 h-2.5 border-b border-l ${config.borderColor}`} />
        <span className={`absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r ${config.borderColor}`} />

        {/* Logo + Header */}
        <div className="flex flex-col items-center mb-8 select-none">
          {/* Icon Container */}
          <div className={`relative w-16 h-16 flex items-center justify-center bg-black/5 dark:bg-obsidian-950 border ${isSuccess ? "border-emerald-accent/40" : "border-gold-accent/40"} transition-colors duration-300`}>
            <span className={`absolute -top-px -left-px w-1.5 h-1.5 border-t border-l ${config.borderColor}`} />
            <span className={`absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r ${config.borderColor}`} />

            {/* Animated checkmark ring for success */}
            {isSuccess && (
              <div className="absolute inset-0 border border-emerald-accent/20 animate-ping" style={{ animationDuration: "2s" }} />
            )}

            <span className={config.accentColor}>
              {config.icon}
            </span>
          </div>

          {/* Title Section */}
          <div className="flex flex-col items-center mt-6 text-center">
            <span className="text-xl font-bold tracking-[0.3em] text-obsidian-950 dark:text-white font-sans">
              CALDAY
            </span>
            <span className={`text-[9px] tracking-[0.45em] font-mono mt-1 uppercase ${config.accentColor}`}>
              {config.title}
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-base font-bold tracking-wide text-obsidian-950 dark:text-white font-sans">
            {config.subtitle}
          </h1>
          <p className="text-sm text-obsidian-950/60 dark:text-white/50 font-mono leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
          <span className={`text-[9px] tracking-[0.3em] font-mono ${config.accentColor}`}>
            {isSuccess ? "✦" : "—"}
          </span>
          <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
        </div>

        {/* CTA Button */}
        <Link
          href={config.linkHref}
          className={`w-full block relative px-6 py-3.5 text-center bg-black/5 dark:bg-obsidian-950 border ${isSuccess ? "border-emerald-accent/40 text-emerald-accent hover:bg-emerald-accent/10 hover:border-emerald-accent" : "border-gold-accent/40 text-gold-accent hover:bg-gold-accent/10 hover:border-gold-accent"} hover:text-obsidian-950 dark:hover:text-white text-xs font-bold tracking-[0.25em] font-sans transition-all duration-300 group rounded-none`}
        >
          {/* Corner brackets on hover */}
          <span className={`absolute bottom-1.5 left-2.5 w-1.5 h-1.5 border-b border-l ${isSuccess ? "border-emerald-accent/0 group-hover:border-emerald-accent/60" : "border-gold-accent/0 group-hover:border-gold-accent/60"} transition-all duration-300`} />
          <span className={`absolute top-1.5 right-2.5 w-1.5 h-1.5 border-t border-r ${isSuccess ? "border-emerald-accent/0 group-hover:border-emerald-accent/60" : "border-gold-accent/0 group-hover:border-gold-accent/60"} transition-all duration-300`} />

          {config.linkText}
        </Link>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 text-center">
          <span className="text-[9px] tracking-widest text-obsidian-950/30 dark:text-white/30 font-mono">
            CALDAY — SMALL STEPS, HEALTHIER DAYS
          </span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex-1 flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950">
        <div className="w-5 h-5 border border-gold-accent/40 border-t-gold-accent animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
