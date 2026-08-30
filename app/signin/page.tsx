"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
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
        toast.error("Sign in failed. Please check your email and password.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("We could not connect right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex-1 flex items-center justify-center px-4 relative overflow-hidden bg-obsidian-950">
      {/* Premium Ambient Grid Backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Container Card */}
      <div className="max-w-md w-full bg-obsidian-900 border border-white/10 p-8 md:p-10 shadow-glow-gold relative overflow-hidden">
        {/* Top Golden Laser Line Accent */}
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-gold-accent to-transparent"></div>

        {/* Sharp Corner Brackets for Card */}
        <span className="absolute -top-px -left-px w-2.5 h-2.5 border-t border-l border-gold-accent"></span>
        <span className="absolute -top-px -right-px w-2.5 h-2.5 border-t border-r border-gold-accent"></span>
        <span className="absolute -bottom-px -left-px w-2.5 h-2.5 border-b border-l border-gold-accent"></span>
        <span className="absolute -bottom-px -right-px w-2.5 h-2.5 border-b border-r border-gold-accent"></span>

        {/* Logo and Headers Section */}
        <div className="flex flex-col items-center mb-8 select-none">
          {/* Geometric Logo Container */}
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
            <span className="text-xl font-bold tracking-[0.3em] text-white font-sans">
              CALDAY
            </span>
            <span className="text-[9px] tracking-[0.45em] text-white/40 font-mono mt-1 uppercase">
              SIGN IN
            </span>
          </div>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email input field */}
          <div className="space-y-2">
            <label className="block text-[9px] tracking-[0.25em] text-white/50 font-mono font-bold uppercase">
              EMAIL ADDRESS
            </label>
            <div className="relative group">
              {/* Highlight corners on focus */}
              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-obsidian-950 border border-white/10 hover:border-white/20 focus:border-gold-accent/60 focus:outline-none px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-300 font-mono rounded-none"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[9px] tracking-[0.25em] text-white/50 font-mono font-bold uppercase">
                PASSWORD
              </label>
            </div>
            <div className="relative group">
              {/* Highlight corners on focus */}
              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold-accent/0 group-focus-within:border-gold-accent/60 transition-all duration-300"></span>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-obsidian-950 border border-white/10 hover:border-white/20 focus:border-gold-accent/60 focus:outline-none px-4 py-3 text-sm text-white placeholder-white/20 transition-all duration-300 font-mono rounded-none"
                placeholder="Enter your password"
              />
            </div>
          </div>


          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative px-6 py-3.5 bg-obsidian-950 border border-gold-accent/40 text-gold-accent hover:text-white hover:bg-gold-accent/10 hover:border-gold-accent text-xs font-bold tracking-[0.25em] font-sans transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group rounded-none"
            >
              {/* Corner decorative brackets on hover */}
              <span className="absolute bottom-1.5 left-2.5 w-1.5 h-1.5 border-b border-l border-gold-accent/0 group-hover:border-gold-accent/60 transition-all duration-300"></span>
              <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 border-t border-r border-gold-accent/0 group-hover:border-gold-accent/60 transition-all duration-300"></span>

              {loading ? "Signing in..." : "Log in"}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[9px] tracking-[0.3em] text-white/30 font-mono">OR</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full relative flex items-center justify-center gap-3 px-6 py-3.5 bg-obsidian-950 border border-white/10 hover:border-white/30 text-white/70 hover:text-white text-xs font-bold tracking-[0.2em] font-sans transition-all duration-300 cursor-pointer group rounded-none"
        >
          {/* Corner decorative brackets on hover */}
          <span className="absolute bottom-1.5 left-2.5 w-1.5 h-1.5 border-b border-l border-white/0 group-hover:border-white/30 transition-all duration-300"></span>
          <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 border-t border-r border-white/0 group-hover:border-white/30 transition-all duration-300"></span>

          {/* Google Icon */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>

          CONTINUE WITH GOOGLE
        </button>

        {/* Footer links */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center relative">
          <span className="text-[9px] tracking-widest text-white/30 font-mono">
            NEW USER?{" "}
            <Link
              href="/signup"
              className="text-gold-accent hover:text-white transition-colors duration-300 font-bold underline underline-offset-4 decoration-gold-accent/20 hover:decoration-white/40"
            >
              Create an account
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
