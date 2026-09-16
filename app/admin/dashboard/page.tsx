"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
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

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    
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
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load dashboard statistics");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "ADMIN") {
            fetchStats();
        }
    }, [status, session, fetchStats]);

    if (status === "loading") {
        return (
            <div className="min-h-[85vh] flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-gold-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-mono tracking-widest text-gold-accent uppercase">
                        Loading Admin Dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
        return (
            <div className="min-h-[85vh] flex items-center justify-center bg-[#f8f6f1] dark:bg-obsidian-950 px-4 py-16">
                <div className="max-w-md w-full text-center p-8 bg-white/80 dark:bg-obsidian-900 border border-red-500/30 relative">
                    <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-red-500" />
                    <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-red-500" />
                    <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-obsidian-950 dark:text-white uppercase tracking-wider mb-2">
                        Access Denied
                    </h2>
                    <p className="text-sm text-obsidian-950/70 dark:text-white/70 mb-6">
                        You do not have administrative permissions to view this section.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-2.5 bg-obsidian-950 text-white dark:bg-white dark:text-obsidian-950 font-mono text-xs uppercase tracking-widest hover:bg-gold-accent dark:hover:bg-gold-accent dark:hover:text-obsidian-950 transition-colors"
                    >
                        Return to Safety
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-14 relative overflow-hidden bg-[#f8f6f1] dark:bg-obsidian-950 text-obsidian-950 dark:text-white transition-colors duration-300">
            {/* Subtle Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-gold-accent">
                            <Shield className="w-3.5 h-3.5" />
                            <span>System Overview</span>
                        </div>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight">
                            Admin Dashboard
                        </h1>
                        <p className="text-xs text-obsidian-950/60 dark:text-white/60 mt-1">
                            Monitor AI usage, meal creation, and system activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchStats}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 hover:border-gold-accent dark:hover:border-gold-accent transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-gold-accent" : ""}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono flex items-center justify-between">
                        <span>{error}</span>
                    </div>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* AI Usage Card */}
                    <div className="p-6 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 relative group">
                        <span className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-gold-accent" />
                        <span className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-gold-accent" />
                        
                        <div className="flex items-center gap-3 mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-gold-accent/10 border border-gold-accent/30 text-gold-accent shrink-0">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">AI Usage Analytics</h3>
                                <p className="text-[10px] font-mono text-obsidian-950/50 dark:text-white/50 uppercase tracking-widest">
                                    Total AI meal requests
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="animate-pulse flex flex-col gap-4">
                                <div className="h-10 bg-black/5 dark:bg-white/5 w-1/2"></div>
                                <div className="h-10 bg-black/5 dark:bg-white/5 w-1/3"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[10px] font-mono text-obsidian-950/60 dark:text-white/60 mb-1">Today</p>
                                    <p className="text-3xl font-bold text-gold-accent">{aiUsage?.today || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono text-obsidian-950/60 dark:text-white/60 mb-1">Last 7 Days</p>
                                    <p className="text-3xl font-bold">{aiUsage?.past7Days || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono text-obsidian-950/60 dark:text-white/60 mb-1">Total All Time</p>
                                    <p className="text-3xl font-bold">{aiUsage?.total || 0}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Meals Created Card */}
                    <div className="p-6 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 relative group">
                        <span className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-emerald-500" />
                        <span className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-emerald-500" />
                        
                        <div className="flex items-center gap-3 mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shrink-0">
                                <Utensils className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Meals Database</h3>
                                <p className="text-[10px] font-mono text-obsidian-950/50 dark:text-white/50 uppercase tracking-widest">
                                    Total created records
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="animate-pulse flex flex-col gap-4">
                                <div className="h-10 bg-black/5 dark:bg-white/5 w-1/2"></div>
                                <div className="h-10 bg-black/5 dark:bg-white/5 w-1/3"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[10px] font-mono text-obsidian-950/60 dark:text-white/60 mb-1">Today</p>
                                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{meals?.today || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono text-obsidian-950/60 dark:text-white/60 mb-1">Last 7 Days</p>
                                    <p className="text-3xl font-bold">{meals?.past7Days || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono text-obsidian-950/60 dark:text-white/60 mb-1">Total Records</p>
                                    <p className="text-3xl font-bold">{meals?.total || 0}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Navigation / Management */}
                <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-gold-accent" />
                    <span>Management Access</span>
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/admin/users" className="group p-5 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 hover:border-gold-accent transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/5 text-obsidian-950 dark:text-white group-hover:bg-gold-accent group-hover:text-obsidian-950 transition-colors">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold font-mono uppercase tracking-wider text-sm">Users Directory</h4>
                                <p className="text-[11px] text-obsidian-950/50 dark:text-white/50">Manage accounts & subscriptions</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-obsidian-950/30 dark:text-white/30 group-hover:text-gold-accent group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link href="/admin/foods" className="group p-5 bg-white/70 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 hover:border-gold-accent transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/5 text-obsidian-950 dark:text-white group-hover:bg-gold-accent group-hover:text-obsidian-950 transition-colors">
                                <Utensils className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold font-mono uppercase tracking-wider text-sm">Foods Database</h4>
                                <p className="text-[11px] text-obsidian-950/50 dark:text-white/50">Manage global food entries</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-obsidian-950/30 dark:text-white/30 group-hover:text-gold-accent group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
