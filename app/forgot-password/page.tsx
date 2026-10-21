"use client";

import axios from "axios";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const inputClass = `w-full min-h-11 rounded-xl border border-secondary bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors duration-200 hover:border-primary focus:border-primary ${focusRing}`;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/auth/forgot-password", { email: normalizedEmail });
      toast.success(res.data?.message || "If an account exists, we have sent a reset link");
      setEmail("");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Could not send reset email"
        : "Unexpected error";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[85vh] flex-1 items-center justify-center overflow-hidden bg-canvas px-4 py-10 text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/50 blur-3xl"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8 md:p-10">
        <div className="mb-6 flex select-none flex-col items-center text-center">
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
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Forget password</h1>
        </div>

        <p className="mb-6 text-center text-base leading-7 text-muted">
          Enter your email and we will send a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="forgot-email" className="block text-sm font-medium text-ink">
              Email address
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email.trim() && !isValidEmail(email)) {
                  toast.error("Please enter a valid email address");
                }
              }}
              className={inputClass}
              placeholder="Enter your email address"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className={`min-h-11 w-full cursor-pointer rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
          Remember your password?{" "}
          <Link
            href="/signin"
            className={`rounded font-semibold text-primary underline underline-offset-4 transition-colors duration-200 hover:text-primary-hover ${focusRing}`}
          >
            Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}