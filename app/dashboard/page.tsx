"use client";

// 🧪 TEST ONLY — ลบออกหลังทดสอบ
// throw ตรงนี้เพื่อให้เห็นหน้า Error Boundary ของ /dashboard
// throw new Error("ทดสอบ Error Boundary — ลบออกหลัง UI แล้ว");

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import type { NutritionTargets } from "@/lib/nutrition";
import MealCalendar from "@/components/ui/MealCalender";

type ProfileApiResponse = {
  profile: {
    gender?: string | null;
    age?: number | null;
    weight?: number | null;
    height?: number | null;
    exerciseLevel?: string | null;
    goal?: string | null;
  } | null;
  bmi: number | null;
  bmiStatus: { label: string; tone: string } | null;
  nutritionTargets: NutritionTargets | null;
  dailyProgress: {
    calories: { consumed: number; target: number; percent: number };
    protein: { consumed: number; target: number; percent: number };
  };
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<ProfileApiResponse | null>(null);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  const displayName = session?.user?.name || session?.user?.email || "Guest user";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let isMounted = true;

    axios
      .get<ProfileApiResponse>("/api/profile")
      .then((res) => {
        if (isMounted) {
          setSummary(res.data);
          setHasLoadedProfile(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSummary(null);
          setHasLoadedProfile(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [status]);

  const profile = summary?.profile ?? null;
  const nutritionTargets = summary?.nutritionTargets ?? null;
  const dailyProgress = summary?.dailyProgress;
  const calorieProgress = Math.min(100, dailyProgress?.calories.percent ?? 0);
  const proteinProgress = Math.min(100, dailyProgress?.protein.percent ?? 0);
  const bmi = summary?.bmi ?? null;
  const bmiStatus = summary?.bmiStatus ?? null;

  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 relative overflow-hidden bg-[#f8f6f1] dark:bg-obsidian-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="mx-auto max-w-6xl relative">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] tracking-[0.35em] text-gold-accent font-mono uppercase">
              Daily dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[0.2em] text-obsidian-950 dark:text-white">
              Your nutrition overview
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/meals/new"
              className="inline-flex items-center justify-center border border-gold-accent/40 bg-gold-accent/10 px-4 py-2 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/20 hover:text-obsidian-950 dark:hover:text-white"
            >
              Add meal
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center border border-black/10 dark:border-white/10 bg-white/70 dark:bg-obsidian-900 px-4 py-2 text-[10px] font-semibold tracking-[0.25em] text-obsidian-950/70 dark:text-white/70 transition-all duration-300 hover:border-gold-accent/50 hover:text-gold-accent"
            >
              View profile
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="relative overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-obsidian-900 p-6 shadow-glow-gold md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_45%)] pointer-events-none" />
            <span className="absolute -top-px -left-px h-3 w-3 border-l border-t border-gold-accent" />
            <span className="absolute -top-px -right-px h-3 w-3 border-r border-t border-gold-accent" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b border-l border-gold-accent" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b border-r border-gold-accent" />

            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex h-20 w-20 items-center justify-center border border-gold-accent/50 bg-black/5 dark:bg-obsidian-950 text-2xl font-bold text-gold-accent">
                {status === "loading" ? "..." : initials}
              </div>

              <div className="flex-1">
                <p className="text-[10px] tracking-[0.35em] text-obsidian-950/45 dark:text-white/45 font-mono uppercase">
                  Today&apos;s focus
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[0.18em] text-obsidian-950 dark:text-white">
                  {status === "loading" ? "LOADING DATA" : displayName}
                </h2>
                <p className="mt-2 text-sm text-obsidian-950/60 dark:text-white/60">
                  Add meals in natural language and let the app estimate calories and protein for your day.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded border border-gold-accent/20 bg-black/5 dark:bg-obsidian-950/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Calories</p>
                  <p className="text-[10px] font-semibold tracking-[0.25em] text-gold-accent">
                    {nutritionTargets ? `${nutritionTargets.calories} kcal` : "—"}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full rounded-full bg-gold-accent transition-all" style={{ width: `${calorieProgress}%` }} />
                </div>
                <p className="mt-3 text-sm text-obsidian-950/65 dark:text-white/65">
                  {dailyProgress ? `${dailyProgress.calories.consumed} / ${dailyProgress.calories.target} kcal` : "Complete your profile to unlock your target."}
                </p>
              </div>

              <div className="rounded border border-emerald-accent/20 bg-black/5 dark:bg-obsidian-950/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Protein</p>
                  <p className="text-[10px] font-semibold tracking-[0.25em] text-emerald-accent">
                    {nutritionTargets ? `${nutritionTargets.protein} g` : "—"}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full rounded-full bg-emerald-accent transition-all" style={{ width: `${proteinProgress}%` }} />
                </div>
                <p className="mt-3 text-sm text-obsidian-950/65 dark:text-white/65">
                  {dailyProgress ? `${dailyProgress.protein.consumed} / ${dailyProgress.protein.target} g` : "Protein goal will appear once your profile is ready."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950/60 p-4">
                <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Goal</p>
                <p className="mt-2 text-sm font-semibold text-obsidian-950 dark:text-white">
                  {profile?.goal ? profile.goal : nutritionTargets?.goalLabel ?? "—"}
                </p>
              </div>
              <div className="rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950/60 p-4">
                <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">BMI</p>
                <p className="mt-2 text-sm font-semibold text-obsidian-950 dark:text-white">{bmi ?? "—"}</p>
              </div>
              <div className={`rounded border p-4 ${bmiStatus?.tone || "border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950/60"}`}>
                <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Status</p>
                <p className="mt-2 text-sm font-semibold">
                  {bmiStatus?.label ?? "No data"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950/60 p-4">
              <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Personal details</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Gender</p>
                  <p className="mt-1 text-sm font-semibold text-obsidian-950 dark:text-white">{profile?.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Age</p>
                  <p className="mt-1 text-sm font-semibold text-obsidian-950 dark:text-white">{profile?.age ? `${profile.age} years` : "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Weight</p>
                  <p className="mt-1 text-sm font-semibold text-obsidian-950 dark:text-white">{profile?.weight ? `${profile.weight} kg` : "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Height</p>
                  <p className="mt-1 text-sm font-semibold text-obsidian-950 dark:text-white">{profile?.height ? `${profile.height} cm` : "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Exercise level</p>
                  <p className="mt-1 text-sm font-semibold text-obsidian-950 dark:text-white">{profile?.exerciseLevel || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Goal</p>
                  <p className="mt-1 text-sm font-semibold text-obsidian-950 dark:text-white">{profile?.goal || nutritionTargets?.goalLabel || "—"}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="relative overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-obsidian-900 p-6">
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

              <p className="text-[10px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Quick insights</p>
              <div className="mt-4 space-y-3 text-sm text-obsidian-950/70 dark:text-white/70">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                  <span className="text-obsidian-950/45 dark:text-white/45">BMR</span>
                  <span className="font-semibold text-obsidian-950 dark:text-white">{nutritionTargets?.bmr ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                  <span className="text-obsidian-950/45 dark:text-white/45">TDEE</span>
                  <span className="font-semibold text-obsidian-950 dark:text-white">{nutritionTargets?.tdee ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-obsidian-950/45 dark:text-white/45">Profile</span>
                  <span className="font-semibold text-obsidian-950 dark:text-white">
                    {hasLoadedProfile ? (summary ? "Ready" : "Needs setup") : "Loading"}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-obsidian-900 p-6">
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

              <p className="text-[10px] tracking-[0.3em] text-obsidian-950/40 dark:text-white/40 font-mono uppercase">Next step</p>
              <p className="mt-3 text-sm leading-7 text-obsidian-950/70 dark:text-white/70">
                Add your personal details to unlock a complete daily nutrition plan and keep your dashboard meaningful.
              </p>
              <Link
                href="/profile/form"
                className="mt-5 inline-flex items-center justify-center border border-gold-accent/40 bg-black/5 dark:bg-obsidian-950 px-4 py-2 text-[10px] font-semibold tracking-[0.25em] text-gold-accent transition-all duration-300 hover:bg-gold-accent/10 hover:text-obsidian-950 dark:hover:text-white"
              >
                Fill profile
              </Link>
            </div>
          </aside>
        </div>
        <MealCalendar />
      </div>
    </div>
  );
}
