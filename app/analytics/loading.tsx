
/**
 * Analytics Loading Skeleton
 * ──────────────────────────
 * Next.js จะแสดงไฟล์นี้อัตโนมัติขณะโหลดหน้า /analytics
 *
 * โครงสร้าง skeleton จำลองตาม layout จริงของ analytics:
 *   - Header (ชื่อหน้า + คำอธิบาย + ตัวเลือกช่วงเวลา)
 *   - Summary section (Highlight cards 3 ใบ)
 *   - Charts section (Calorie chart + Protein chart)
 *
 * ใช้ animate-pulse เพื่อทำเอฟเฟกต์กะพริบ
 * (ปิดอัตโนมัติเมื่อผู้ใช้ตั้งค่า reduced motion)
 * สีและ spacing ใช้ token ของ CalDay Design System
 * (canvas, surface, line, muted, ink)
 */

const pulse = "animate-pulse motion-reduce:animate-none";

export default function AnalyticLoading() {
  return (
    <div className="min-h-[85vh] flex-1 bg-canvas px-4 py-8 text-ink md:py-12">
      <div className="mx-auto max-w-280 space-y-8">

        {/* ── Header skeleton ── */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            {/* Heading */}
            <div className={`h-8 w-48 rounded-lg bg-line ${pulse}`} />

            {/* Description */}
            <div className={`h-4 w-64 rounded bg-line ${pulse}`} />
          </div>

          {/* Time Range Selector */}
          <div className={`h-11 w-40 rounded-xl bg-line ${pulse}`} />
        </div>

        {/* ── Summary section: Highlight cards ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-line bg-surface p-6 shadow-soft"
            >
              {/* Card title */}
              <div className={`mb-4 h-4 w-28 rounded bg-line ${pulse}`} />

              {/* Main value */}
              <div className={`mb-4 h-10 w-24 rounded bg-line ${pulse}`} />

              {/* Description */}
              <div className={`h-4 w-36 rounded bg-line ${pulse}`} />
            </div>
          ))}
        </div>

        {/* ── Charts section ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Calorie Chart Skeleton */}
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
            {/* Chart header */}
            <div className="mb-8 space-y-2">
              <div className={`h-5 w-36 rounded bg-line ${pulse}`} />
              <div className={`h-4 w-28 rounded bg-line ${pulse}`} />
            </div>

            {/* Bar chart */}
            <div className="flex h-48 items-end justify-between gap-2">
              {[35, 60, 45, 80, 55, 70, 40].map((height, i) => (
                <div
                  key={i}
                  className={`w-full max-w-10 rounded-t-md bg-line ${pulse}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            {/* Chart footer */}
            <div className={`mt-6 h-4 w-full rounded bg-line ${pulse}`} />
          </div>

          {/* Protein Chart Skeleton */}
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
            {/* Chart header */}
            <div className="mb-8 space-y-2">
              <div className={`h-5 w-36 rounded bg-line ${pulse}`} />
              <div className={`h-4 w-28 rounded bg-line ${pulse}`} />
            </div>

            {/* Horizontal bar chart */}
            <div className="space-y-5">
              {[1, 2, 3, 4, 5].map((item, i) => (
                <div key={item} className="flex items-center gap-4">
                  {/* Label */}
                  <div className={`h-4 w-10 rounded bg-line ${pulse}`} />

                  {/* Progress bar */}
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-line">
                    <div
                      className={`h-full rounded-full bg-muted/30 ${pulse}`}
                      style={{
                        width: `${[65, 80, 45, 90, 55][i]}%`,
                      }}
                    />
                  </div>

                  {/* Value */}
                  <div className={`h-4 w-10 rounded bg-line ${pulse}`} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
