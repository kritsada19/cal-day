"use client";

import axios from "axios";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const inputBase = `w-full min-h-11 rounded-xl border bg-surface px-4 py-3 text-base text-ink placeholder:text-muted transition-colors duration-200 ${focusRing}`;
const inputClass = `${inputBase} border-secondary hover:border-primary focus:border-primary`;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordMismatch = Boolean(confirmPassword && password && password !== confirmPassword);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error("Please provide name, email, password and confirm password");
      return;
    }

    if (passwordMismatch) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/auth/signup", {
        name,
        email,
        password,
        confirmPassword,
      });

      toast.success(res.data?.message || "User created successfully");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Signup failed"
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
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="signup-name" className="block text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="signup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={inputClass}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className="block text-sm font-medium text-ink">
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
              placeholder="Enter your email address"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-password" className="block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
              placeholder="Enter a password"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-ink">
              Confirm password
            </label>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              aria-invalid={passwordMismatch}
              aria-describedby={passwordMismatch ? "signup-confirm-password-error" : undefined}
              className={
                passwordMismatch
                  ? `${inputBase} border-danger focus:border-danger`
                  : inputClass
              }
              placeholder="Repeat your password"
            />
            {passwordMismatch && (
              <p id="signup-confirm-password-error" role="alert" className="text-sm font-medium text-danger">
                Passwords do not match
              </p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className={`min-h-11 w-full cursor-pointer rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
          Already have an account?{" "}
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