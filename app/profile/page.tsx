"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { NutritionTargets } from "@/lib/nutrition";

type ProfileData = {
  gender?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  exerciseLevel?: string | null;
  goal?: string | null;
};

type ProfileApiResponse = {
  subscription?: {
    plan?: string | null;
  } | null;
  profile: ProfileData | null;
  bmi: number | null;
  bmiStatus: { label: string; tone: string } | null;
  nutritionTargets: NutritionTargets | null;
  dailyProgress: {
    calories: { consumed: number; target: number; percent: number };
    protein: { consumed: number; target: number; percent: number };
  };
  aiUsage?: number;
  aiLimit?: number;
  aiRemaining?: number;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const primaryButton = `inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`;
const tintButton = `inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-tint px-5 py-2.5 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink ${focusRing}`;
const outlineButton = `inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-secondary bg-surface px-5 py-2.5 text-base font-semibold text-ink transition-colors duration-200 hover:bg-primary-tint ${focusRing}`;

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<ProfileApiResponse | null>(null);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  const displayName = session?.user?.name || session?.user?.email || t("guestUser");
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get<ProfileApiResponse>("/api/profile");

      setProfileData(res.data);
      setHasLoadedProfile(true);
    } catch {
      setProfileData(null);
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

    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (Number(data.userId) !== Number(session?.user?.id)) {
        return;
      }

      if (data.type === "profile.updated") {
        fetchProfile();
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    return () => {
      eventSource.close();
    };
  }, [status, session?.user?.id, fetchProfile]);

  const profile = profileData?.profile ?? null;
  const bmi = profileData?.bmi ?? null;
  const bmiStatus = profileData?.bmiStatus ?? null;
  const nutritionTargets = profileData?.nutritionTargets ?? null;
  const plan = profileData?.subscription?.plan;

  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-280">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">{t("yourProfile")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
              {t("yourAccount")}
            </h1>
          </div>
          <Link href="/" className={tintButton}>
            {t("backToHome")}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-highlight text-2xl font-bold text-ink">
                {status === "loading" ? "..." : initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted">{t("accountStatus")}</p>
                <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink">
                  {status === "loading" ? t("loadingProfile") : displayName}
                </h2>
                <p className="mt-1 truncate text-base text-muted">
                  {session?.user?.email || t("loginToView")}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {plan && (
                    <span className="inline-flex min-h-8 items-center rounded-full bg-highlight px-3 text-sm font-semibold text-ink">
                      {plan} {t("plan")}
                    </span>
                  )}
                  <Link href="/profile/form" className={tintButton}>
                    {t("fillPersonalInfo")}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-line bg-canvas p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-ink">{t("profileSummary")}</h3>
                <Link
                  href="/profile/form"
                  className={`rounded py-2 text-sm font-semibold text-primary underline underline-offset-4 transition-colors duration-200 hover:text-primary-hover ${focusRing}`}
                >
                  {t("editProfile")}
                </Link>
              </div>

              {status !== "authenticated" ? (
                <p className="mt-4 text-base text-muted">{t("pleaseSignIn")}</p>
              ) : !hasLoadedProfile ? (
                <div role="status" className="mt-4 space-y-3">
                  <span className="sr-only">{t("loadingProfile")}</span>
                  <div className="h-24 animate-pulse rounded-xl bg-line motion-reduce:animate-none" />
                  <div className="h-24 animate-pulse rounded-xl bg-line motion-reduce:animate-none" />
                </div>
              ) : profile ? (
                <div className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                  <div className={`rounded-xl border p-4 ${bmiStatus?.tone || "border-line bg-surface text-ink"}`}>
                    <p className="text-sm text-muted">{t("bmi")}</p>
                    <p className="mt-2 text-3xl font-semibold text-ink tabular-nums">{bmi ?? "—"}</p>
                    <p className="mt-2 text-base font-semibold">
                      {bmiStatus ? `${bmiStatus.label}` : t("noData")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-line bg-surface p-4">
                    <div className="mb-4 rounded-xl border border-line bg-canvas p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted">{t("goal")}</p>
                        <p className="text-sm font-semibold text-primary">{nutritionTargets ? nutritionTargets.goalLabel : "—"}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {t("goalDescription")}
                      </p>
                    </div>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <Detail label={t("gender")} value={profile.gender || "—"} />
                      <Detail label={t("age")} value={profile.age ? `${profile.age} ${t("years")}` : "—"} />
                      <Detail label={t("weight")} value={profile.weight ? `${profile.weight} ${t("kg")}` : "—"} />
                      <Detail label={t("height")} value={profile.height ? `${profile.height} ${t("cm")}` : "—"} />
                      <Detail label={t("exerciseLevel")} value={profile.exerciseLevel || "—"} />
                      <Detail label={t("goal")} value={profile.goal || "—"} />
                    </dl>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-base text-muted">
                  {t("noProfileData")}
                </p>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">{t("accountDetails")}</h2>
              <dl className="mt-3 divide-y divide-line text-base">
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-muted">{t("userId")}</dt>
                  <dd className="font-semibold text-ink tabular-nums">{session?.user?.id ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-muted">{t("role")}</dt>
                  <dd className="font-semibold text-ink">{session?.user?.role || "USER"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-muted">{t("plan")}</dt>
                  <dd>
                    <Link
                      href="/subscription"
                      className={`rounded font-semibold text-primary underline underline-offset-4 transition-colors duration-200 hover:text-primary-hover ${focusRing}`}
                    >
                      {plan ?? "—"}
                    </Link>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3 pb-0">
                  <dt className="text-muted">{t("aiRemaining")}</dt>
                  <dd className="font-semibold text-ink tabular-nums">
                    {profileData?.aiRemaining !== undefined
                      ? `${profileData.aiRemaining} / ${profileData.aiLimit}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              {status === "authenticated" ? (
                <>
                  <h2 className="text-lg font-semibold text-ink">{t("quickActions")}</h2>
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className={`${tintButton} w-full cursor-pointer`}
                    >
                      {t("logOut")}
                    </button>
                    <Link href="/" className={outlineButton}>
                      {t("goToHome")}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-ink">{t("loginRequired")}</h2>
                  <p className="mt-3 text-base leading-7 text-muted">
                    {t("loginToViewProfile")}
                  </p>
                  <Link href="/signin" className={`mt-4 ${primaryButton}`}>
                    {t("logIn")}
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}