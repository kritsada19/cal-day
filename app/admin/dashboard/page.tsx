"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import { useTranslations } from "next-intl";
import {
    Activity,
    Utensils,
    Users,
    Shield,
    Database,
    ArrowRight,
    RefreshCw
} from "lucide-react";

// define state interfaces
interface StatsData {
    today: number;
    past7Days: number;
    total: number;
}

const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const cardClass = "rounded-2xl border border-line bg-surface p-6 shadow-soft";

function StatsSkeleton() {
    return (
        <div role="status" className="flex flex-col gap-4">
            <span className="sr-only">Loading statistics...</span>
            <div className="h-10 w-1/2 animate-pulse rounded-lg bg-primary-tint motion-reduce:animate-none"></div>
            <div className="h-10 w-1/3 animate-pulse rounded-lg bg-primary-tint motion-reduce:animate-none"></div>
        </div>
    );
}

function StatValue({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div>
            <dt className="mb-1 text-sm text-muted">{label}</dt>
            <dd className={`text-3xl font-bold tabular-nums tracking-tight ${highlight ? "text-primary" : "text-ink"}`}>{value}</dd>
        </div>
    );
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const t = useTranslations("admin");

    const [aiUsage, setAiUsage] = useState<StatsData | null>(null);
    const [meals, setMeals] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [aiRes, mealsRes] = await Promise.all([
                axios.get<StatsData>("/api/admin/dashboard/aiUsage"),
                axios.get<StatsData>("/api/admin/dashboard/meals")
            ]);

            setAiUsage(aiRes.data);
            setMeals(mealsRes.data);
        } catch (err: unknown) {
            if (axios.isAxiosError<{ message?: string }>(err)) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load dashboard statistics"
                );
            } else {
                setError("Failed to load dashboard statistics");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "ADMIN") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchStats();
        }
    }, [status, session, fetchStats]);

    if (status === "loading") {
        return (
            <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas">
                <div role="status" className="flex flex-col items-center gap-4">
                    <div
                        aria-hidden="true"
                        className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none"
                    />
                    <p className="text-base text-muted">{t("loadingAdminDashboard")}</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
        return (
            <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-16">
                <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
                        <Shield className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold tracking-tight text-ink">
                        {t("accessDenied")}
                    </h2>
                    <p className="mb-6 text-base leading-7 text-muted">
                        {t("accessDeniedMessage")}
                    </p>
                    <Link
                        href="/"
                        className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`}
                    >
                        {t("returnToSafety")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
            />

            <div className="relative mx-auto max-w-280">
                {/* Header Section */}
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-muted">
                            <Shield className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                            <span>{t("systemOverview")}</span>
                        </div>
                        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                            {t("adminDashboard")}
                        </h1>
                        <p className="mt-1 text-base text-muted">
                            {t("dashboardSubtitle")}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchStats}
                            disabled={loading}
                            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary-tint px-5 text-base font-semibold text-primary transition-colors duration-200 hover:bg-highlight hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            <span>{t("refresh")}</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex items-center justify-between rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-medium text-danger"
                    >
                        <span>{error}</span>
                    </div>
                )}

                {/* Main Stats Grid */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* AI Usage Card */}
                    <div className={cardClass}>
                        <div className="mb-6 flex items-center gap-3 border-b border-line pb-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                                <Activity className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-ink">{t("aiUsageAnalytics")}</h2>
                                <p className="text-sm text-muted">{t("totalAiMealRequests")}</p>
                            </div>
                        </div>

                        {loading ? (
                            <StatsSkeleton />
                        ) : (
                            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                <StatValue label={t("today")} value={aiUsage?.today || 0} highlight />
                                <StatValue label={t("last7Days")} value={aiUsage?.past7Days || 0} />
                                <StatValue label={t("totalAllTime")} value={aiUsage?.total || 0} />
                            </dl>
                        )}
                    </div>

                    {/* Meals Created Card */}
                    <div className={cardClass}>
                        <div className="mb-6 flex items-center gap-3 border-b border-line pb-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-highlight text-ink">
                                <Utensils className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-ink">{t("mealsDatabase")}</h2>
                                <p className="text-sm text-muted">{t("totalCreatedRecords")}</p>
                            </div>
                        </div>

                        {loading ? (
                            <StatsSkeleton />
                        ) : (
                            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                <StatValue label={t("today")} value={meals?.today || 0} highlight />
                                <StatValue label={t("last7Days")} value={meals?.past7Days || 0} />
                                <StatValue label={t("totalAllTime")} value={meals?.total || 0} />
                            </dl>
                        )}
                    </div>
                </div>

                {/* Quick Navigation / Management */}
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight">
                    <Database className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
                    <span>{t("managementAccess")}</span>
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link
                        href="/admin/users"
                        className={`group flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft transition-colors duration-200 hover:border-primary ${focusRing}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary transition-colors duration-200 group-hover:bg-highlight group-hover:text-ink">
                                <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-ink">{t("usersDirectory")}</h3>
                                <p className="text-sm text-muted">{t("manageAccounts")}</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary motion-reduce:transition-none" strokeWidth={1.75} aria-hidden="true" />
                    </Link>

                    <Link
                        href="/admin/foods"
                        className={`group flex items-center justify-between rounded-2xl border border-line bg-surface p-5 shadow-soft transition-colors duration-200 hover:border-primary ${focusRing}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary transition-colors duration-200 group-hover:bg-highlight group-hover:text-ink">
                                <Utensils className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-ink">{t("foodsDatabase")}</h3>
                                <p className="text-sm text-muted">{t("manageFoodEntries")}</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary motion-reduce:transition-none" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    );
}