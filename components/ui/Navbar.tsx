"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import { logger } from "@/lib/logger";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
  active: boolean;
}

type ProfileApiResponse = {
  subscription?: {
    plan?: string | null;
  } | null;
  dailyProgress: {
    calories: { consumed: number; target: number; percent: number };
    protein: { consumed: number; target: number; percent: number };
  };
};

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const [userData, setUserData] = useState<ProfileApiResponse | null>(null);

  const consumed = userData?.dailyProgress.calories.consumed ?? 0;
  const target = userData?.dailyProgress.calories.target ?? 0;

  const percentage = Math.min((consumed / target) * 100, 100);
  const remaining = Math.max(target - consumed, 0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get<ProfileApiResponse>("/api/profile");
        setUserData(response.data);
      } catch (error) {
        logger.error({ err: error }, "Error fetching profile data");
      }
    };

    fetchProfile();
  }, [session]);

  if (!mounted) return null;

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" },
    { label: "New Entry", href: "/meals/new", active: pathname === "/meals/new" },
    { label: "Analytics", href: "/analytics", active: pathname === "/analytics" },
    { label: "Subscription", href: "/subscription", active: pathname === "/subscription" },
  ];

  return (
    <nav className="w-full bg-[#f8f6f1] dark:bg-obsidian-950 border-b border-black/10 dark:border-white/10 sticky top-0 z-50 shadow-glow-gold">
      {/* Premium Top Golden Laser Line Accent */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-gold-accent to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Left Section: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Geometric Sharp Logo Icon */}
              <div className="relative w-9 h-9 flex items-center justify-center bg-white/70 dark:bg-obsidian-900 border border-gold-accent/40 group-hover:border-gold-accent transition-colors duration-300">
                {/* Accent corner brackets to enhance sharp mechanical design */}
                <span className="absolute -top-px -left-px w-1.25 h-1.25 border-t border-l border-gold-accent"></span>
                <span className="absolute -bottom-px -right-px w-1.25 h-1.25 border-b border-r border-gold-accent"></span>

                {/* Inner flame core SVG */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-gold-accent group-hover:scale-110 group-hover:text-white transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                  <polygon points="12 7 17 10 17 14 12 17 7 14 7 10" fill="currentColor" fillOpacity="0.2" />
                </svg>
              </div>

              {/* Monospaced track letter Logo text */}
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-[0.3em] text-obsidian-950 dark:text-white font-sans group-hover:text-gold-accent transition-colors duration-300">
                  CALDAY
                </span>
                <span className="text-[8px] tracking-[0.45em] text-obsidian-950/40 dark:text-white/40 font-mono">
                  DAILY TRACKER
                </span>
              </div>
            </Link>
          </div>

          {/* Middle Section: Navigation Menu Items (desktop, login-only) */}
          {session?.user && (
            <div className="hidden lg:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative px-6 py-2.5 text-xs font-semibold tracking-[0.2em] transition-all duration-300 font-sans border-t border-transparent hover:text-gold-500 rounded-none group ${item.active
                    ? "text-gold-accent bg-black/5 dark:bg-white/5 border-t-gold-accent"
                    : "text-obsidian-950/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                >
                  {/* Hover bracket decoration */}
                  <span className="absolute bottom-1 left-2 w-1.5 h-1.5 border-b border-l border-gold-accent/0 group-hover:border-gold-accent/40 transition-all duration-300"></span>
                  <span className="absolute top-1 right-2 w-1.5 h-1.5 border-t border-r border-gold-accent/0 group-hover:border-gold-accent/40 transition-all duration-300"></span>

                  {item.label}

                  {/* Bottom line for active tab */}
                  {item.active && (
                    <span className="absolute bottom-0 left-0 w-full h-px bg-gold-accent text-glow-gold"></span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Right Section: Calorie status indicator and Profile (desktop) */}
          {session?.user ? (
            <div className="hidden lg:flex items-center gap-6">

              {/* Calorie Stats Card (Geometric, Sharp) */}
              <div className="bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 px-4 py-2 flex items-center gap-4 relative overflow-hidden group">
                {/* Corner decor */}
                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-black/20 dark:border-white/20"></span>
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-black/20 dark:border-white/20"></span>

                {target > 0 ? (
                  <div className="flex flex-col">
                    <div className="flex justify-between items-baseline gap-8 text-[10px] tracking-wider text-obsidian-950/50 dark:text-white/50 font-mono">
                      <span>DAILY BALANCE</span>
                      <span className="text-obsidian-950 dark:text-white font-semibold">
                        <span className="text-emerald-accent text-glow-emerald font-bold">{consumed}</span> / {target} kcal
                      </span>
                    </div>

                    {/* Target Progress Bar */}
                    <div className="w-48 h-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mt-1.5 relative">
                      <div
                        className="h-full bg-emerald-accent shadow-glow-emerald transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                      {/* Subtle target ticks */}
                      <span className="absolute top-0 left-1/2 w-px h-full bg-black/20 dark:bg-white/20"></span>
                      <span className="absolute top-0 left-3/4 w-px h-full bg-black/20 dark:bg-white/20"></span>
                    </div>

                    <div className="flex justify-between text-[9px] tracking-widest text-obsidian-950/30 dark:text-white/30 font-mono mt-1">
                      <span>PROGRESS</span>
                      <span className="text-gold-accent text-glow-gold font-semibold">{remaining} KCAL LEFT</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-48 py-2">
                    <span className="text-[10px] tracking-widest text-obsidian-950/50 dark:text-white/50 font-mono">ยังไม่ได้กรอกโปรไฟล์</span>
                  </div>
                )}
              </div>

              {/* Profile Avatar & Rank Widget */}
              <Link href="/profile" className="flex items-center gap-3">
                {/* Sharp Profile Container */}
                <div className="relative group cursor-pointer">
                  {/* Diagonal cut capsule */}
                  <div className="bg-white/70 dark:bg-linear-to-r dark:from-obsidian-900 dark:to-obsidian-800 border border-black/10 dark:border-white/10 hover:border-gold-accent/50 px-4 py-1.5 flex items-center gap-3 transition-colors duration-300">
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-bold tracking-wider text-obsidian-950 dark:text-white">{session?.user?.name}</span>
                      <span className="text-[8px] font-mono tracking-widest text-gold-accent font-bold">{userData?.subscription?.plan} PLAN</span>
                    </div>
                    {/* Avatar Frame (Sharp Box) */}
                    <div className="w-8 h-8 bg-obsidian-700 border border-gold-accent flex items-center justify-center text-xs font-bold text-gold-accent group-hover:bg-gold-accent group-hover:text-black transition-all duration-300">
                      {session?.user?.name?.substring(0, 2)}
                    </div>
                  </div>
                </div>
              </Link>

              {/* Theme Toggle */}
              <ThemeToggle />

            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/signin" className="px-4 py-2 text-xs font-semibold tracking-[0.2em] text-obsidian-950/70 dark:text-white/80 hover:text-gold-accent transition-colors duration-200">
                LOG IN
              </Link>
              <Link href="/signup" className="px-4 py-2 text-xs font-semibold tracking-[0.2em] text-obsidian-950/70 dark:text-white/80 hover:text-gold-accent transition-colors duration-200">
                CREATE ACCOUNT
              </Link>
              {/* Theme Toggle (unauthenticated) */}
              <ThemeToggle />
            </div>
          )}

          {/* Mobile menu button (Hamburger Menu, Sharp) */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 hover:border-gold-accent p-2 text-obsidian-950/80 dark:text-white/80 hover:text-obsidian-950 dark:hover:text-white transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel — animated slide-down via grid-template-rows */}
      <div
        aria-hidden={!mobileMenuOpen}
        className={`lg:hidden grid overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-black/10 dark:border-white/10 bg-[#f8f6f1] dark:bg-obsidian-950 px-4 py-4 space-y-4">

            {/* Nav links — login only */}
            {session?.user && (
              <div className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full block text-left px-4 py-3 text-xs font-semibold tracking-[0.2em] transition-all duration-200 border-l-2 ${item.active
                      ? "text-gold-accent bg-black/5 dark:bg-white/5 border-l-gold-accent"
                      : "text-obsidian-950/60 dark:text-white/60 border-l-transparent hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Calorie widget + profile + sign out — login only */}
            {session?.user && (
              <>
                {/* Mobile Calorie Stats Widget */}
                <div className="bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-4 space-y-3">
                  {target > 0 ? (
                    <>
                      <div className="flex justify-between items-baseline text-[10px] tracking-wider text-obsidian-950/50 dark:text-white/50 font-mono">
                        <span>DAILY BALANCE</span>
                        <span className="text-obsidian-950 dark:text-white font-semibold">
                          <span className="text-emerald-accent font-bold">{consumed}</span> / {target} kcal
                        </span>
                      </div>

                      {/* Target Progress Bar */}
                      <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 relative">
                        <div
                          className="h-full bg-emerald-accent shadow-glow-emerald transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-2">
                      <span className="text-[10px] tracking-widest text-obsidian-950/50 dark:text-white/50 font-mono">ยังไม่ได้กรอกโปรไฟล์</span>
                    </div>
                  )}
                </div>

                {/* Mobile Profile Display */}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 border-t border-black/10 dark:border-white/10 pt-4 px-1"
                >
                  <div className="w-10 h-10 bg-obsidian-700 border border-gold-accent flex items-center justify-center text-sm font-bold text-gold-accent">
                    {session?.user?.name?.substring(0, 2) || "?"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-wider text-obsidian-950 dark:text-white">{session?.user?.name || "MEMBER"}</span>
                    <span className="text-[8px] font-mono tracking-widest text-gold-accent font-bold">{userData?.subscription?.plan} PLAN</span>
                  </div>
                </Link>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full text-left px-4 py-3 text-xs font-semibold tracking-[0.2em] text-red-500/80 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 border-l-2 border-l-transparent hover:border-l-red-500/50 transition-all duration-200"
                >
                  SIGN OUT
                </button>
              </>
            )}

            {/* Auth links — logged-out only */}
            {!session?.user && (
              <div className="flex flex-col space-y-1 border-t border-black/10 dark:border-white/10 pt-4">
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block text-left px-4 py-3 text-xs font-semibold tracking-[0.2em] text-obsidian-950/70 dark:text-white/80 hover:text-gold-accent hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200"
                >
                  LOG IN
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block text-left px-4 py-3 text-xs font-semibold tracking-[0.2em] text-obsidian-950/70 dark:text-white/80 hover:text-gold-accent hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200"
                >
                  CREATE ACCOUNT
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}