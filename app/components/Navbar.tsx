"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface NavItem {
  label: string;
  href: string;
  active: boolean;
}

export default function Navbar() {
  const [activeTab, setActiveTab] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  // Daily calorie tracking state for interactive WOW effect
  const [consumed] = useState(1420);
  const target = 2200;

  const percentage = Math.min((consumed / target) * 100, 100);
  const remaining = Math.max(target - consumed, 0);

  const navItems: NavItem[] = [
    { label: "DASHBOARD", href: "#", active: activeTab === "DASHBOARD" },
    { label: "DIARY", href: "#", active: activeTab === "DIARY" },
    { label: "ANALYTICS", href: "#", active: activeTab === "ANALYTICS" },
    { label: "ELITE CLUB", href: "#", active: activeTab === "ELITE CLUB" },
  ];

  return (
    <nav className="w-full bg-obsidian-950 border-b border-white/10 sticky top-0 z-50 shadow-glow-gold">
      {/* Premium Top Golden Laser Line Accent */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-gold-accent to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Left Section: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Geometric Sharp Logo Icon */}
              <div className="relative w-9 h-9 flex items-center justify-center bg-obsidian-900 border border-gold-accent/40 group-hover:border-gold-accent transition-colors duration-300">
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
                <span className="text-xl font-bold tracking-[0.3em] text-white font-sans group-hover:text-gold-accent transition-colors duration-300">
                  CALDAY
                </span>
                <span className="text-[8px] tracking-[0.45em] text-white/40 font-mono">
                  CHRONO METRIC
                </span>
              </div>
            </Link>
          </div>

          {/* Middle Section: Navigation Menu Items */}
          <div className="hidden lg:flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`relative px-6 py-2.5 text-xs font-semibold tracking-[0.2em] transition-all duration-300 font-sans border-t border-transparent hover:text-gold-500 rounded-none group ${item.active
                  ? "text-gold-accent bg-white/5 border-t-gold-accent"
                  : "text-white/60 hover:bg-white/2"
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
              </button>
            ))}
          </div>

          {/* Right Section: Calorie status indicator and Profile */}
          {session?.user ? (
            <div className="hidden lg:flex items-center gap-6">

              {/* Calorie Stats Card (Geometric, Sharp) */}
              < div className="bg-obsidian-900 border border-white/10 px-4 py-2 flex items-center gap-4 relative overflow-hidden group">
                {/* Corner decor */}
                <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20"></span>
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20"></span>

                <div className="flex flex-col">
                  <div className="flex justify-between items-baseline gap-8 text-[10px] tracking-wider text-white/50 font-mono">
                    <span>ENERGY BALANCE</span>
                    <span className="text-white font-semibold">
                      <span className="text-emerald-accent text-glow-emerald font-bold">{consumed}</span> / {target} kcal
                    </span>
                  </div>

                  {/* Target Progress Bar */}
                  <div className="w-48 h-1.5 bg-white/5 border border-white/10 mt-1.5 relative">
                    <div
                      className="h-full bg-emerald-accent shadow-glow-emerald transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                    {/* Subtle target ticks */}
                    <span className="absolute top-0 left-1/2 w-px h-full bg-white/20"></span>
                    <span className="absolute top-0 left-3/4 w-px h-full bg-white/20"></span>
                  </div>

                  <div className="flex justify-between text-[9px] tracking-widest text-white/30 font-mono mt-1">
                    <span>METABOLIC</span>
                    <span className="text-gold-accent text-glow-gold font-semibold">{remaining} KCAL REMAINING</span>
                  </div>
                </div>
              </div>

              {/* Profile Avatar & Rank Widget */}
              <Link href="/profile" className="flex items-center gap-3">
                {/* Sharp Profile Container */}
                <div className="relative group cursor-pointer">
                  {/* Diagonal cut capsule */}
                  <div className="bg-linear-to-r from-obsidian-900 to-obsidian-800 border border-white/10 hover:border-gold-accent/50 px-4 py-1.5 flex items-center gap-3 transition-colors duration-300">
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-bold tracking-wider text-white">{session?.user?.name}</span>
                      <span className="text-[8px] font-mono tracking-widest text-gold-accent font-bold">PRO ELITE</span>
                    </div>
                    {/* Avatar Frame (Sharp Box) */}
                    <div className="w-8 h-8 bg-obsidian-700 border border-gold-accent flex items-center justify-center text-xs font-bold text-gold-accent group-hover:bg-gold-accent group-hover:text-black transition-all duration-300">
                      {session?.user?.name?.substring(0, 2)}
                    </div>
                  </div>
                </div>
              </Link>

            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/signin" className="px-4 py-2 text-xs font-semibold tracking-[0.2em] text-white/80 hover:text-gold-accent transition-colors duration-200">
                SIGN IN
              </Link>
              <Link href="/signup" className="px-4 py-2 text-xs font-semibold tracking-[0.2em] text-white/80 hover:text-gold-accent transition-colors duration-200">
                SIGN UP
              </Link>
            </div>
          )}

          {/* Mobile menu button (Hamburger Menu, Sharp) */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="bg-obsidian-900 border border-white/10 hover:border-gold-accent p-2 text-white/80 hover:text-white transition-colors duration-200"
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

      {/* Mobile Menu Panel */}
      {
        mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-obsidian-950 px-4 py-4 space-y-4">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveTab(item.label);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-xs font-semibold tracking-[0.2em] transition-all duration-200 border-l-2 ${item.active
                    ? "text-gold-accent bg-white/5 border-l-gold-accent"
                    : "text-white/60 border-l-transparent hover:bg-white/2"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Mobile Calorie Stats Widget */}
            <div className="bg-obsidian-900 border border-white/10 p-4 space-y-3">
              <div className="flex justify-between items-baseline text-[10px] tracking-wider text-white/50 font-mono">
                <span>ENERGY BALANCE</span>
                <span className="text-white font-semibold">
                  <span className="text-emerald-accent font-bold">{consumed}</span> / {target} kcal
                </span>
              </div>

              {/* Target Progress Bar */}
              <div className="w-full h-1.5 bg-white/5 border border-white/10 relative">
                <div
                  className="h-full bg-emerald-accent shadow-glow-emerald transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Mobile Profile Display */}
            <div className="flex items-center gap-3 border-t border-white/10 pt-4 px-1">
              <div className="w-10 h-10 bg-obsidian-800 border border-gold-accent flex items-center justify-center text-sm font-bold text-gold-accent">
                KS
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wider text-white">KRIT S.</span>
                <span className="text-[8px] font-mono tracking-widest text-gold-accent font-bold">PRO ELITE MEMBER</span>
              </div>
            </div>
          </div>
        )
      }
    </nav >
  );
}
