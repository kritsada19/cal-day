"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const rangeButton = (active: boolean) =>
  `min-h-11 cursor-pointer rounded-lg px-5 text-sm font-semibold transition-colors duration-200 ${focusRing} ${active ? "bg-surface text-primary shadow-soft" : "text-muted hover:text-ink"
  }`;

const cardClass = "rounded-2xl border border-line bg-surface p-6 shadow-soft";

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
  const { data: session, status } = useSession();

  // ห่อ fetchAnalytics ด้วย useCallback เพื่อให้ SSE effect
  // เรียก refetch ได้โดยไม่ต้องสร้างฟังก์ชันใหม่ทุก render
  const fetchAnalytics = useCallback(async () => {
    setFetching(true);
    try {
      const days = timeRange === "7D" ? 7 : 30;
      const response = await axios.get<AnalyticsResponse>(`/api/analytics?days=${days}`);
      setData(response.data.weeklyData);
      setStats(response.data.stats);
    } catch (error) {
      logger.error({ err: error, timeRange }, "Error fetching analytics data");
    } finally {
      setFetching(false);
    }
  }, [timeRange]);

  // โหลดข้อมูล analytics ครั้งแรก และโหลดใหม่เมื่อ timeRange เปลี่ยน
  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchData = async () => {
      await fetchAnalytics();
    };
    fetchData();
  }, [fetchAnalytics, status, session?.user?.id]);

  // SSE — รับ Real-time event จาก Server
  // แยก useEffect ออกจาก fetch เพื่อให้ lifecycle ชัดเจน:
  // effect นี้จะ connect ครั้งเดียวตอน authenticated และ cleanup ตอน unmount
  useEffect(() => {
    if (status !== "authenticated") return;

    // สร้างการเชื่อมต่อ SSE จาก Browser → Server
    // เมื่อสร้างแล้ว Browser จะเชื่อมต่อไปยัง URL ที่กำหนด และรอ Server ส่ง Event มา
    const eventSource = new EventSource("/api/events");

    // เมื่อ EventSource ได้รับ message จาก Server → ให้เรียกฟังก์ชันนี้
    // event คือ ข้อมูลที่ Browser ได้รับจาก SSE
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // กรองเฉพาะ event ของ user คนนี้เท่านั้น
      if (Number(data.userId) !== session?.user?.id) return;

      // ถ้ามีการเพิ่ม/ลบ Meal หรืออัปเดต Profile → โหลด analytics ใหม่
      if (
        data.type === "meal.created" ||
        data.type === "meal.deleted" ||
        data.type === "profile.updated"
      ) {
        fetchAnalytics();
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    return () => {
      // ปิด SSE connection → ไปเรียก cancel() ที่ app/api/events/route.ts
      eventSource.close();
    };
  }, [status, session?.user?.id, fetchAnalytics]);

  const loading = status === "loading" || (status === "authenticated" && fetching);

  if (loading) {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4">
        <p role="status" className="animate-pulse text-base text-muted motion-reduce:animate-none">
          Loading analytics...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-[85vh] flex-1 items-center justify-center bg-canvas px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-soft">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Restricted access</h2>
          <p className="mt-3 text-base leading-7 text-muted">Please log in to view analytics</p>
          <Link
            href="/signin"
            className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-hover ${focusRing}`}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const recentActive = stats.activeDays.slice(-7);
  const isUnderTarget = stats.averageCalories <= stats.targetCal;

  return (
    <div className="relative min-h-[85vh] flex-1 bg-canvas px-4 py-8 text-ink selection:bg-highlight selection:text-ink md:py-12">
      <div className="mx-auto max-w-280 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Analytics</h1>
            <p className="mt-1 text-sm font-medium text-muted">Performance overview</p>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-xl bg-primary-tint p-1">
            <button
              onClick={() => setTimeRange("7D")}
              aria-pressed={timeRange === "7D"}
              className={rangeButton(timeRange === "7D")}
            >
              7 days
            </button>
            <button
              onClick={() => setTimeRange("30D")}
              aria-pressed={timeRange === "30D"}
              className={rangeButton(timeRange === "30D")}
            >
              30 days
            </button>
          </div>
        </div>

        {/* Highlights / Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1: Average Calories */}
          <div className={cardClass}>
            <p className="mb-3 text-sm font-medium text-muted">Avg calories</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-ink tabular-nums">{stats.averageCalories}</span>
              <span className="text-sm text-muted">kcal/day</span>
            </div>

            {/* Status Indicator */}
            <p className="mt-4 flex items-center gap-2 text-sm">
              {isUnderTarget ? (
                <>
                  <span className="font-semibold text-primary tabular-nums">↓ {Math.abs(stats.targetCal - stats.averageCalories)} kcal</span>
                  <span className="text-muted">Under target</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-danger tabular-nums">↑ {stats.averageCalories - stats.targetCal} kcal</span>
                  <span className="text-muted">Over target</span>
                </>
              )}
            </p>
          </div>

          {/* Card 2: Consistency Score */}
          <div className={cardClass}>
            <p className="mb-3 text-sm font-medium text-muted">Consistency score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-ink tabular-nums">{stats.consistencyScore}</span>
              <span className="text-sm text-muted">%</span>
            </div>

            {/* Simple Progress Line */}
            <div
              role="progressbar"
              aria-label="Consistency score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(stats.consistencyScore)}
              className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-tint"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-1000 motion-reduce:transition-none"
                style={{ width: `${stats.consistencyScore}%` }}
              ></div>
            </div>
          </div>

          {/* Card 3: Current Streak */}
          <div className={cardClass}>
            <p className="mb-3 text-sm font-medium text-muted">Current streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-ink tabular-nums">{stats.currentStreak}</span>
              <span className="text-sm text-muted">days</span>
            </div>

            <div
              role="img"
              aria-label={`${recentActive.filter(Boolean).length} of the last ${recentActive.length} days active`}
              className="mt-4 flex gap-1"
            >
              {/* แสดง Streak ของ 7 วันล่าสุด */}
              {recentActive.map((active, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${active ? "bg-primary" : "bg-line"}`}></div>
              ))}
              {stats.activeDays.length === 0 && (
                <div className="h-2 flex-1 rounded-full bg-line"></div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Calorie Trend Chart (Custom CSS Bar Chart) */}
          <div className={cardClass}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">Calorie intake</h2>
                <p className="mt-1 text-sm text-muted">Last {timeRange === "7D" ? "7 days" : "30 days"}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted">
                <div className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-primary"></span> Consumed</div>
                <div className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-danger"></span> Over target</div>
                <div className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0 w-3 border-t-2 border-dashed border-secondary"></span> Target</div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative flex h-48 items-end justify-between gap-1 sm:gap-2">
              {/* Target Line Guideline (Assumed around 80% height) */}
              <div aria-hidden="true" className="absolute left-0 top-[20%] z-0 w-full border-t-2 border-dashed border-secondary/60"></div>

              {data.map((d, i) => {
                // คำนวณความสูงของแท่งกราฟเทียบกับ Target (สมมติให้ Target อยู่ที่ความสูง 80%)
                const heightPercent = d.targetCal > 0 ? Math.min((d.calories / d.targetCal) * 80, 100) : 0;
                const isOver = d.calories > d.targetCal;
                const isZero = d.calories === 0;

                return (
                  <div
                    key={i}
                    role="img"
                    aria-label={`${d.day}: ${d.calories} kcal${isOver ? ", over target" : ""}`}
                    className="group relative z-10 flex h-full flex-1 flex-col items-center justify-end"
                  >
                    {/* Bar */}
                    <div
                      className={`relative w-full max-w-10 rounded-t-md transition-all duration-500 ease-out motion-reduce:transition-none ${isOver ? "bg-danger" : isZero ? "bg-line" : "bg-primary group-hover:bg-primary-hover"}`}
                      style={{ height: `${heightPercent}%`, minHeight: isZero ? '4px' : '0' }}
                    >
                      {/* Tooltip on Hover */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2 py-1 text-xs font-medium text-ink opacity-0 shadow-lift transition-opacity group-hover:opacity-100"
                      >
                        {d.calories} kcal
                      </div>
                    </div>
                    {/* Label (Show less labels if 30D to avoid crowding) */}
                    {(timeRange === "7D" || i % 4 === 0) && (
                      <span aria-hidden="true" className="absolute -bottom-6 mt-3 text-xs text-muted">{d.day}</span>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Space for labels */}
            <div className="h-6"></div>
          </div>

          {/* Protein Trend Chart (Custom CSS Stacked/Gauge style) */}
          <div className={cardClass}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">Protein intake</h2>
                <p className="mt-1 text-sm text-muted">Last {timeRange === "7D" ? "7 days" : "30 days"}</p>
              </div>
              <div className="flex gap-4 text-sm text-muted">
                <div className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-secondary"></span> Consumed</div>
                <div className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3 w-0.5 bg-ink"></span> Target</div>
              </div>
            </div>

            {/* Chart Area */}
            <div
              role="region"
              aria-label="Daily protein intake"
              tabIndex={0}
              className={`custom-scrollbar relative flex h-48 flex-col justify-between overflow-y-auto pr-2 ${focusRing}`}
            >
              {data.map((d, i) => {
                const proteinPercent = d.targetPro > 0 ? Math.min((d.protein / d.targetPro) * 100, 100) : 0;
                // Hide rows with 0 protein in 30D view to save space, or just show them compact
                if (timeRange === "30D" && d.protein === 0) return null;

                return (
                  <div key={i} className="group flex cursor-default items-center gap-2 py-1 sm:gap-4">
                    <span className="w-10 text-right text-xs text-muted transition-colors group-hover:text-ink">{d.day}</span>

                    {/* Horizontal Bar */}
                    <div aria-hidden="true" className="relative h-3 flex-1 overflow-hidden rounded-full bg-primary-tint">
                      <div
                        className="h-full rounded-full bg-secondary transition-all duration-700 ease-out motion-reduce:transition-none"
                        style={{ width: `${proteinPercent}%` }}
                      ></div>
                      {/* Target Marker */}
                      <div className="absolute right-0 top-0 h-full w-0.5 bg-ink/60"></div>
                    </div>

                    <span className="w-14 text-right text-sm font-medium text-ink tabular-nums">
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