"use client";

// 🧪 TEST ONLY — ลบออกหลังทดสอบ
// throw ตรงนี้เพื่อให้เห็นหน้า Error Boundary ของ /dashboard
// throw new Error("ทดสอบ Error Boundary — ลบออกหลัง UI แล้ว");

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const primaryButton = `inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`;
const secondaryButton = `inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-tint px-5 py-2.5 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`;

function MetricTile({
  label,
  targetLabel,
  unit,
  progress,
  percent,
  emptyMessage,
  loading,
  barClassName,
  dotClassName,
}: {
  label: string;
  targetLabel: string;
  unit: string;
  progress: { consumed: number; target: number } | undefined;
  percent: number;
  emptyMessage: string;
  loading: boolean;
  barClassName: string;
  dotClassName: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-muted">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotClassName}`} />
          {label}
        </p>
        <p className="text-sm font-semibold text-ink tabular-nums">{targetLabel}</p>
      </div>

      {loading ? (
        <div role="status" className="mt-3">
          <span className="sr-only">Loading {label.toLowerCase()}...</span>
          <div className="h-9 w-32 animate-pulse rounded-lg bg-primary-tint motion-reduce:animate-none" />
        </div>
      ) : progress ? (
        <p className="mt-3 text-ink">
          <span className="text-3xl font-bold tabular-nums">{progress.consumed}</span>
          <span className="text-sm text-muted tabular-nums">
            {" "}
            / {progress.target} {unit}
          </span>
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">{emptyMessage}</p>
      )}

      <div
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="mt-4 h-2 overflow-hidden rounded-full bg-primary-tint"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

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

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get<ProfileApiResponse>("/api/profile");

      setSummary(res.data);
      setHasLoadedProfile(true);
    } catch {
      setSummary(null);
      setHasLoadedProfile(true);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const fetchData = async () => {
      await fetchProfile();
    };
    fetchData();
  }, [status, fetchProfile]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    // สร้างการเชื่อมต่อ SSE จาก Browser → Server
    // เมื่อสร้างแล้ว Browser จะเชื่อมต่อไปยัง URL ที่กำหนด และรอ Server ส่ง Event มา
    const eventSource = new EventSource("/api/events");

    // เมื่อ EventSource ได้รับ message จาก Server → ให้เรียกฟังก์ชันนี้
    // event คือ ข้อมูลที่ Browser ได้รับจาก SSE
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (Number(data.userId) !== (session?.user?.id)) {
        return;
      }

      if (data.type === "meal.created" || data.type === "meal.deleted" || data.type === "profile.updated") {
        fetchProfile();
      }
    };

    eventSource.addEventListener("heartbeat", (event) => {
      console.log("Heartbeat received from server:", JSON.parse(event.data));
    });

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    return () => {
      // ไปเรียก cancel() ที่ app/api/events/route.ts
      eventSource.close();
    };
  }, [status, session?.user?.id, fetchProfile]);

  const profile = summary?.profile ?? null;
  const nutritionTargets = summary?.nutritionTargets ?? null;
  const dailyProgress = summary?.dailyProgress;
  const calorieProgress = Math.min(100, dailyProgress?.calories.percent ?? 0);
  const proteinProgress = Math.min(100, dailyProgress?.protein.percent ?? 0);
  const bmi = summary?.bmi ?? null;
  const bmiStatus = summary?.bmiStatus ?? null;

  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-280">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Daily dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
              Your nutrition overview
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/meals/new" className={primaryButton}>
              Add meal
            </Link>
            <Link href="/profile" className={secondaryButton}>
              View profile
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-highlight text-xl font-bold text-ink">
                {status === "loading" ? "..." : initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted">Today&apos;s focus</p>
                <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink">
                  {status === "loading" ? "Loading data" : displayName}
                </h2>
                <p className="mt-2 text-base leading-7 text-muted">
                  Add meals in natural language and let the app estimate calories and protein for your day.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <MetricTile
                label="Calories"
                targetLabel={nutritionTargets ? `${nutritionTargets.calories} kcal` : "—"}
                unit="kcal"
                progress={dailyProgress?.calories}
                percent={calorieProgress}
                emptyMessage="Complete your profile to unlock your target."
                loading={!hasLoadedProfile}
                barClassName="bg-primary"
                dotClassName="bg-primary"
              />
              <MetricTile
                label="Protein"
                targetLabel={nutritionTargets ? `${nutritionTargets.protein} g` : "—"}
                unit="g"
                progress={dailyProgress?.protein}
                percent={proteinProgress}
                emptyMessage="Protein goal will appear once your profile is ready."
                loading={!hasLoadedProfile}
                barClassName="bg-secondary"
                dotClassName="bg-secondary"
              />
            </div>

            <dl className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-line bg-canvas p-4">
                <dt className="text-sm text-muted">Goal</dt>
                <dd className="mt-1 text-base font-semibold text-ink">
                  {profile?.goal ? profile.goal : nutritionTargets?.goalLabel ?? "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-line bg-canvas p-4">
                <dt className="text-sm text-muted">BMI</dt>
                <dd className="mt-1 text-base font-semibold text-ink tabular-nums">{bmi ?? "—"}</dd>
              </div>
              <div className={`rounded-xl border p-4 ${bmiStatus?.tone || "border-line bg-canvas text-ink"}`}>
                <dt className="text-sm text-muted">Status</dt>
                <dd className="mt-1 text-base font-semibold">
                  {bmiStatus?.label ?? "No data"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl border border-line bg-canvas p-4 md:p-5">
              <h3 className="text-base font-semibold text-ink">Personal details</h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted">Gender</dt>
                  <dd className="mt-1 text-base font-semibold text-ink">{profile?.gender || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Age</dt>
                  <dd className="mt-1 text-base font-semibold text-ink">{profile?.age ? `${profile.age} years` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Weight</dt>
                  <dd className="mt-1 text-base font-semibold text-ink">{profile?.weight ? `${profile.weight} kg` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Height</dt>
                  <dd className="mt-1 text-base font-semibold text-ink">{profile?.height ? `${profile.height} cm` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Exercise level</dt>
                  <dd className="mt-1 text-base font-semibold text-ink">{profile?.exerciseLevel || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Goal</dt>
                  <dd className="mt-1 text-base font-semibold text-ink">{profile?.goal || nutritionTargets?.goalLabel || "—"}</dd>
                </div>
              </dl>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Quick insights</h2>
              <dl className="mt-3 divide-y divide-line text-base">
                <div className="flex items-center justify-between py-3">
                  <dt className="text-muted">BMR</dt>
                  <dd className="font-semibold text-ink tabular-nums">{nutritionTargets?.bmr ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="text-muted">TDEE</dt>
                  <dd className="font-semibold text-ink tabular-nums">{nutritionTargets?.tdee ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between py-3 pb-0">
                  <dt className="text-muted">Profile</dt>
                  <dd className="font-semibold text-ink">
                    {hasLoadedProfile ? (summary ? "Ready" : "Needs setup") : "Loading"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Next step</h2>
              <p className="mt-3 text-base leading-7 text-muted">
                Add your personal details to unlock a complete daily nutrition plan and keep your dashboard meaningful.
              </p>
              <Link href="/profile/form" className={`mt-5 ${primaryButton}`}>
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