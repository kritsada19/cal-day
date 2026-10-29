"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const inputClass = `w-full min-h-11 rounded-xl border border-secondary bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;

export default function SignInPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(t("loginError"));
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error(t("loginUnavailable"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[85vh] flex-1 items-center justify-center overflow-hidden bg-canvas px-4 py-10 text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/50 blur-3xl"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8 md:p-10">
        <div className="mb-8 flex select-none flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-on-primary">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
              <polygon points="12 7 17 10 17 14 12 17 7 14 7 10" fill="currentColor" fillOpacity="0.25" />
            </svg>
          </div>

          <span className="mt-4 text-xl font-bold tracking-tight text-ink">CALDAY</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{t("loginTitle")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="signin-email" className="block text-sm font-medium text-ink">
              {t("emailAddress")}
            </label>
            <input
              id="signin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder={t("emailAddress")}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="signin-password" className="block text-sm font-medium text-ink">
                {t("password")}
              </label>
              <Link
                href="/forgot-password"
                className={`rounded py-1 text-sm font-medium text-primary underline underline-offset-4 transition-colors duration-200 hover:text-primary-hover ${focusRing}`}
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <input
              id="signin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder={t("password")}
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className={`min-h-11 w-full cursor-pointer rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              {loading ? t("loggingIn") : t("loginButton")}
            </button>
          </div>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-line"></div>
          <span className="text-sm text-muted">{t("or")}</span>
          <div className="h-px flex-1 bg-line"></div>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className={`flex min-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-secondary bg-surface px-6 py-3 text-base font-semibold text-ink transition-colors duration-200 hover:bg-primary-tint ${focusRing}`}
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {t("continueGoogle")}
        </button>

        <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
          {t("newUser")} {" "}
          <Link
            href="/signup"
            className={`rounded font-semibold text-primary underline underline-offset-4 transition-colors duration-200 hover:text-primary-hover ${focusRing}`}
          >
            {t("createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}