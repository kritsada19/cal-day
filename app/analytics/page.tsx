"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { logger } from "@/lib/logger";

// Types for the Analytics API Response
interface DailyData {
  day: string;
  date: string;
  calories: number;
  targetCal: number;
  protein: number;
  targetPro: number;
}

interface AnalyticsStats {
  averageCalories: number;
  consistencyScore: number;
  currentStreak: number;
  activeDays: boolean[];
  targetCal: number;
}

interface AnalyticsResponse {
  weeklyData: DailyData[];
  stats: AnalyticsStats;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7D" | "30D">("7D");
  const [fetching, setFetching] = useState(false);

  const [data, setData] = useState<DailyData[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    averageCalories: 0,
    consistencyScore: 0,
    currentStreak: 0,
    activeDays: [],
    targetCal: 2000,
  });
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    const fetchAnalytics = async () => {
      setFetching(true);
      try {
        const days = timeRange === "7D" ? 7 : 30;
        const response = await axios.get<AnalyticsResponse>(`/api/analytics?days=${days}`);
        if (cancelled) return;
        setData(response.data.weeklyData);
        setStats(response.data.stats);
      } catch (error) {
        if (!cancelled) {
          logger.error({ err: error, timeRange }, "Error fetching analytics data");
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [status, timeRange]);

  const loading = status === "loading" || (status === "authenticated" && fetching);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] dark:bg-obsidian-950 flex items-center justify-center">
        <div className="text-gold-accent font-mono text-sm tracking-widest animate-pulse">LOADING ANALYTICS...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#f8f6f1] dark:bg-obsidian-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-obsidian-950 dark:text-white text-xl font-bold tracking-widest mb-4">RESTRICTED ACCESS</h2>
        <p className="text-obsidian-950/50 dark:text-white/50 text-sm mb-8 font-mono">PLEASE LOG IN TO VIEW ANALYTICS</p>
        <a href="/signin" className="px-6 py-2 border border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-black transition-colors text-xs font-bold tracking-widest">
          SIGN IN
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] dark:bg-obsidian-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-[0.25em] text-obsidian-950 dark:text-white font-sans uppercase flex items-center gap-3">
              {/* ตกแต่งด้วยไอคอนสไตล์ Geometric */}
              <span className="w-4 h-4 bg-gold-accent flex items-center justify-center rotate-45">
                <span className="w-2 h-2 bg-[#f8f6f1] dark:bg-obsidian-950"></span>
              </span>
              Analytics
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-gold-accent mt-2">
              PERFORMANCE OVERVIEW
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center border border-black/10 dark:border-white/10 bg-white/70 dark:bg-obsidian-900 p-1">
            <button
              onClick={() => setTimeRange("7D")}
              className={`px-4 py-1.5 text-[10px] font-mono tracking-widest transition-all duration-300 ${timeRange === "7D" ? "bg-gold-accent text-black font-bold" : "text-obsidian-950/50 dark:text-white/50 hover:text-obsidian-950 dark:hover:text-white"}`}
            >
              7 DAYS
            </button>
            <button
              onClick={() => setTimeRange("30D")}
              className={`px-4 py-1.5 text-[10px] font-mono tracking-widest transition-all duration-300 ${timeRange === "30D" ? "bg-gold-accent text-black font-bold" : "text-obsidian-950/50 dark:text-white/50 hover:text-obsidian-950 dark:hover:text-white"}`}
            >
              30 DAYS
            </button>
          </div>
        </div>

        {/* Highlights / Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Average Calories */}
          <div className="relative bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-6 group overflow-hidden">
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold-accent"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold-accent"></span>

            <p className="text-[10px] font-mono tracking-[0.3em] text-obsidian-950/50 dark:text-white/50 mb-4">AVG CALORIES</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-obsidian-950 dark:text-white tracking-wider">{stats.averageCalories}</span>
              <span className="text-xs text-obsidian-950/40 dark:text-white/40 font-mono">kcal/day</span>
            </div>

            {/* Status Indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs font-mono">
              {stats.averageCalories <= stats.targetCal ? (
                <>
                  <span className="text-emerald-accent text-glow-emerald">↓ {Math.abs(stats.targetCal - stats.averageCalories)} kcal</span>
                  <span className="text-obsidian-950/30 dark:text-white/30">UNDER TARGET</span>
                </>
              ) : (
                <>
                  <span className="text-red-400">↑ {stats.averageCalories - stats.targetCal} kcal</span>
                  <span className="text-obsidian-950/30 dark:text-white/30">OVER TARGET</span>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Consistency Score */}
          <div className="relative bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-6 group overflow-hidden">
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold-accent"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold-accent"></span>

            <p className="text-[10px] font-mono tracking-[0.3em] text-obsidian-950/50 dark:text-white/50 mb-4">CONSISTENCY SCORE</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gold-accent text-glow-gold tracking-wider">{stats.consistencyScore}</span>
              <span className="text-xs text-gold-accent/40 font-mono">%</span>
            </div>

            {/* Simple Progress Line */}
            <div className="w-full h-1 bg-black/10 dark:bg-white/5 mt-4 relative">
              <div className="absolute top-0 left-0 h-full bg-gold-accent shadow-glow-gold transition-all duration-1000" style={{ width: `${stats.consistencyScore}%` }}></div>
            </div>
          </div>

          {/* Card 3: Current Streak */}
          <div className="relative bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-6 group overflow-hidden">
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold-accent"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold-accent"></span>

            <p className="text-[10px] font-mono tracking-[0.3em] text-obsidian-950/50 dark:text-white/50 mb-4">CURRENT STREAK</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-obsidian-950 dark:text-white tracking-wider">{stats.currentStreak}</span>
              <span className="text-xs text-obsidian-950/40 dark:text-white/40 font-mono">DAYS</span>
            </div>

            <div className="mt-4 flex gap-1">
              {/* แสดง Streak ของ 7 วันล่าสุด */}
              {stats.activeDays.slice(-7).map((active, i) => (
                <div key={i} className={`h-2 flex-1 ${active ? 'bg-emerald-accent shadow-glow-emerald' : 'bg-black/10 dark:bg-white/10'}`}></div>
              ))}
              {stats.activeDays.length === 0 && (
                <div className="h-2 flex-1 bg-black/10 dark:bg-white/10"></div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Calorie Trend Chart (Custom CSS Bar Chart) */}
          <div className="relative bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-6">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-sm font-semibold tracking-widest text-obsidian-950 dark:text-white uppercase">Calorie Intake</h3>
                <p className="text-[10px] font-mono text-obsidian-950/40 dark:text-white/40 mt-1">LAST {timeRange}</p>
              </div>
              <div className="flex gap-4 text-[10px] font-mono text-obsidian-950/60 dark:text-white/60">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-black/20 dark:bg-white/20"></span> Consumed</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-0.5 bg-gold-accent"></span> Target</div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 relative">
              {/* Target Line Guideline (Assumed around 80% height) */}
              <div className="absolute top-[20%] left-0 w-full border-t border-dashed border-gold-accent/30 z-0"></div>

              {data.map((d, i) => {
                // คำนวณความสูงของแท่งกราฟเทียบกับ Target (สมมติให้ Target อยู่ที่ความสูง 80%)
                const heightPercent = d.targetCal > 0 ? Math.min((d.calories / d.targetCal) * 80, 100) : 0;
                const isOver = d.calories > d.targetCal;
                const isZero = d.calories === 0;

                return (
                  <div key={i} className="relative flex flex-col items-center flex-1 z-10 group">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-obsidian-950 border border-black/20 dark:border-white/20 px-2 py-1 text-[10px] font-mono text-obsidian-950 dark:text-white pointer-events-none whitespace-nowrap z-20">
                      {d.calories} kcal
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full max-w-10 transition-all duration-500 ease-out ${isOver ? 'bg-red-500/80' : isZero ? 'bg-black/5 dark:bg-white/5' : 'bg-black/20 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/30'}`}
                      style={{ height: `${heightPercent}%`, minHeight: isZero ? '4px' : '0' }}
                    >
                      {/* ขีดไฮไลต์ด้านบนแท่งกราฟ */}
                      {!isZero && (
                        <div className={`w-full h-1 ${isOver ? 'bg-red-400' : 'bg-black/50 dark:bg-white/50'}`}></div>
                      )}
                    </div>
                    {/* Label (Show less labels if 30D to avoid crowding) */}
                    {(timeRange === "7D" || i % 4 === 0) && (
                      <span className="text-[9px] font-mono text-obsidian-950/40 dark:text-white/40 mt-3 absolute -bottom-5">{d.day}</span>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Space for labels */}
            <div className="h-5"></div>
          </div>

          {/* Protein Trend Chart (Custom CSS Stacked/Gauge style) */}
          <div className="relative bg-white/80 dark:bg-obsidian-900 border border-black/10 dark:border-white/10 p-6">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-sm font-semibold tracking-widest text-obsidian-950 dark:text-white uppercase">Protein Intake</h3>
                <p className="text-[10px] font-mono text-obsidian-950/40 dark:text-white/40 mt-1">LAST {timeRange}</p>
              </div>
              <div className="flex gap-4 text-[10px] font-mono text-obsidian-950/60 dark:text-white/60">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-accent"></span> Consumed</div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-48 flex flex-col justify-between relative overflow-y-auto pr-2 custom-scrollbar">
              {data.map((d, i) => {
                const proteinPercent = d.targetPro > 0 ? Math.min((d.protein / d.targetPro) * 100, 100) : 0;
                // Hide rows with 0 protein in 30D view to save space, or just show them compact
                if (timeRange === "30D" && d.protein === 0) return null;

                return (
                  <div key={i} className="flex items-center gap-2 sm:gap-4 group cursor-default py-1">
                    <span className="w-8 text-[9px] font-mono text-obsidian-950/40 dark:text-white/40 text-right group-hover:text-obsidian-950 dark:group-hover:text-white transition-colors">{d.day}</span>

                    {/* Horizontal Bar */}
                    <div className="flex-1 h-3 bg-black/5 dark:bg-white/5 relative overflow-hidden">
                      <div
                        className="h-full bg-emerald-accent shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-700 ease-out"
                        style={{ width: `${proteinPercent}%` }}
                      ></div>
                      {/* Target Marker */}
                      <div className="absolute top-0 right-0 h-full w-px bg-black/40 dark:bg-white/40"></div>
                    </div>

                    <span className="w-12 text-[10px] font-mono text-obsidian-950/80 dark:text-white/80 text-right">
                      {d.protein}g
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
