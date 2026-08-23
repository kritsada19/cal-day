/**
 * Analytics Loading Skeleton
 * ──────────────────────────
 * Next.js จะแสดงไฟล์นี้ขณะโหลดหน้า /analytics
 *
 * จำลองโครงสร้าง analytics page:
 *   - Header + time-range selector (7D / 30D)
 *   - Summary cards 3 ใบ (Avg Calories, Consistency Score, Streak)
 *   - Charts 2 กล่อง (Calorie bar chart, Protein horizontal bars)
 *
 * แท่งกราฟ skeleton ใช้ความสูงสุ่มเพื่อให้ดูเหมือนข้อมูลจริง
 */

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-obsidian-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── Header + time selector ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-3">
            {/* Title row พร้อม geometric icon */}
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gold-accent/30 rotate-45 animate-pulse" />
              <div className="h-8 w-40 rounded bg-white/10 animate-pulse" />
            </div>
            {/* "PERFORMANCE OVERVIEW" label */}
            <div className="h-3 w-44 rounded bg-gold-accent/20 animate-pulse" />
          </div>

          {/* Time range selector skeleton */}
          <div className="flex items-center border border-white/10 bg-obsidian-900 p-1">
            <div className="h-8 w-20 bg-gold-accent/15 animate-pulse" />
            <div className="h-8 w-20 bg-white/5 animate-pulse" />
          </div>
        </div>

        {/* ── Summary cards (3 ใบ) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Average Calories */}
          <div className="relative bg-obsidian-900 border border-white/10 p-6 overflow-hidden">
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold-accent" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold-accent" />

            <div className="h-2.5 w-24 rounded bg-white/10 animate-pulse mb-4" />
            <div className="flex items-baseline gap-2">
              <div className="h-10 w-24 rounded bg-white/15 animate-pulse" />
              <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="mt-4 h-3 w-36 rounded bg-emerald-accent/15 animate-pulse" />
          </div>

          {/* Card 2: Consistency Score */}
          <div className="relative bg-obsidian-900 border border-white/10 p-6 overflow-hidden">
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold-accent" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold-accent" />

            <div className="h-2.5 w-32 rounded bg-white/10 animate-pulse mb-4" />
            <div className="flex items-baseline gap-2">
              <div className="h-10 w-16 rounded bg-gold-accent/20 animate-pulse" />
              <div className="h-3 w-6 rounded bg-gold-accent/15 animate-pulse" />
            </div>
            {/* Progress bar skeleton */}
            <div className="w-full h-1 bg-white/5 mt-4">
              <div className="h-full w-3/5 bg-gold-accent/25 animate-pulse" />
            </div>
          </div>

          {/* Card 3: Current Streak */}
          <div className="relative bg-obsidian-900 border border-white/10 p-6 overflow-hidden">
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold-accent" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold-accent" />

            <div className="h-2.5 w-28 rounded bg-white/10 animate-pulse mb-4" />
            <div className="flex items-baseline gap-2">
              <div className="h-10 w-12 rounded bg-white/15 animate-pulse" />
              <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
            </div>
            {/* Streak dots */}
            <div className="mt-4 flex gap-1">
              {[65, 100, 40, 100, 80, 100, 55].map((_, i) => (
                <div key={i} className={`h-2 flex-1 ${i % 2 === 0 ? 'bg-emerald-accent/20' : 'bg-white/10'} animate-pulse`} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Charts section (2 กล่อง) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calorie bar chart skeleton */}
          <div className="relative bg-obsidian-900 border border-white/10 p-6">
            <div className="flex justify-between items-end mb-8">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-white/8 animate-pulse" />
              </div>
              {/* Legend */}
              <div className="flex gap-3">
                <div className="h-2.5 w-20 rounded bg-white/8 animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-gold-accent/15 animate-pulse" />
              </div>
            </div>

            {/* แท่งกราฟ skeleton — ความสูงต่างกันเพื่อให้ดู realistic */}
            <div className="h-48 flex items-end justify-between gap-2 relative">
              {/* เส้น target line */}
              <div className="absolute top-[20%] left-0 w-full border-t border-dashed border-gold-accent/15" />
              {[55, 70, 40, 85, 60, 45, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full max-w-10 bg-white/10 animate-pulse"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="h-5" />
          </div>

          {/* Protein horizontal bars skeleton */}
          <div className="relative bg-obsidian-900 border border-white/10 p-6">
            <div className="flex justify-between items-end mb-8">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-white/8 animate-pulse" />
              </div>
              <div className="h-2.5 w-20 rounded bg-emerald-accent/15 animate-pulse" />
            </div>

            {/* แถวโปรตีน skeleton — ความกว้างต่างกัน */}
            <div className="h-48 flex flex-col justify-between">
              {[60, 80, 35, 90, 50, 70, 45].map((w, i) => (
                <div key={i} className="flex items-center gap-4 py-1">
                  <div className="w-8 h-2.5 rounded bg-white/10 animate-pulse" />
                  <div className="flex-1 h-3 bg-white/5 relative overflow-hidden">
                    <div
                      className="h-full bg-emerald-accent/20 animate-pulse"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                  <div className="w-10 h-2.5 rounded bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
