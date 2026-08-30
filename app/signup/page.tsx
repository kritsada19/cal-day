"use client";

import axios from "axios";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

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
    <div className="min-h-[85vh] flex-1 flex items-center justify-center px-4 relative overflow-hidden bg-obsidian-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-md w-full bg-obsidian-900 border border-white/10 p-8 md:p-10 shadow-glow-gold relative overflow-hidden">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-gold-accent to-transparent"></div>

        <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t border-l border-gold-accent"></span>
        <span className="absolute -top-px -right-px w-2.5 h-2.5 border-t border-r border-gold-accent"></span>
        <span className="absolute -bottom-px -left-px w-2.5 h-2.5 border-b border-l border-gold-accent"></span>
        <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r border-gold-accent"></span>

        <div className="flex flex-col items-center mb-8 select-none">
          <div className="relative w-12 h-12 flex items-center justify-center bg-obsidian-950 border border-gold-accent/40 group hover:border-gold-accent transition-colors duration-300">
            <span className="absolute -top-px -left-px w-1.25 h-1.25 border-t border-l border-gold-accent"></span>
            <span className="absolute -bottom-px -right-px w-1.25 h-1.25 border-b border-r border-gold-accent"></span>

            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-gold-accent group-hover:scale-110 group-hover:text-white transition-all duration-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
              <polygon points="12 7 17 10 17 14 12 17 7 14 7 10" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </div>

          <div className="flex flex-col items-center mt-4 text-center">
            <span className="text-xl font-bold tracking-[0.3em] text-white font-sans">CALDAY</span>
            <span className="text-[9px] tracking-[0.45em] text-white/40 font-mono mt-1 uppercase">
              CREATE YOUR ACCOUNT
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[9px] tracking-[0.25em] text-white/50 font-mono font-bold uppercase">
              FULL NAME
            </label>
            <div className="relative group">
              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-obsidian-950 border border-white/10 hover:border-white/20 focus:border-gold-accent/60 focus:outline-none px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-300 font-mono rounded-none"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] tracking-[0.25em] text-white/50 font-mono font-bold uppercase">
              EMAIL ADDRESS
            </label>
            <div className="relative group">
              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-obsidian-950 border border-white/10 hover:border-white/20 focus:border-gold-accent/60 focus:outline-none px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-300 font-mono rounded-none"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] tracking-[0.25em] text-white/50 font-mono font-bold uppercase">
              PASSWORD
            </label>
            <div className="relative group">
              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full bg-obsidian-950 border border-white/10 hover:border-white/20 focus:border-gold-accent/60 focus:outline-none px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-300 font-mono rounded-none"
                placeholder="Enter a password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] tracking-[0.25em] text-white/50 font-mono font-bold uppercase">
              CONFIRM PASSWORD
            </label>
            <div className="relative group">
              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full bg-obsidian-950 border border-white/10 hover:border-white/20 focus:border-gold-accent/60 focus:outline-none px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-300 font-mono rounded-none"
                placeholder="Repeat your password"
              />
            </div>
            {passwordMismatch && (
              <p className="text-[10px] tracking-wider font-mono text-red-400">Passwords do not match</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || passwordMismatch}
              className="w-full relative px-6 py-3.5 bg-obsidian-950 border border-gold-accent/40 text-gold-accent hover:text-white hover:bg-gold-accent/10 hover:border-gold-accent text-xs font-bold tracking-[0.25em] font-sans transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group rounded-none"
            >
              <span className="absolute bottom-1.5 left-2.5 w-1.5 h-1.5 border-b border-l border-gold-accent/0 group-hover:border-gold-accent/60 transition-all duration-300"></span>
              <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 border-t border-r border-gold-accent/0 group-hover:border-gold-accent/60 transition-all duration-300"></span>

              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center relative">
          <span className="text-[9px] tracking-widest text-white/30 font-mono">
            ALREADY HAVE AN ACCOUNT?{" "}
            <Link
              href="/signin"
              className="text-gold-accent hover:text-white transition-colors duration-300 font-bold underline underline-offset-4 decoration-gold-accent/20 hover:decoration-white/40"
            >
              Back to log in
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
