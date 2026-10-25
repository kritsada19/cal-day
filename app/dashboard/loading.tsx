/**
 * Dashboard Loading Skeleton
 * ──────────────────────────
 * Next.js จะแสดงไฟล์นี้อัตโนมัติขณะโหลดหน้า /dashboard
 *
 * โครงสร้าง skeleton จำลองตาม layout จริงของ dashboard:
 *   - Header (ชื่อหน้า + ปุ่ม action)
 *   - Main section (avatar, progress bar แคลอรี่ & โปรตีน, stat cards)
 *   - Sidebar (quick insights + next step)
 *
 * ใช้ animate-pulse เพื่อทำเอฟเฟกต์กะพริบ (ปิดอัตโนมัติเมื่อผู้ใช้ตั้งค่า reduced motion)
 * สีและ spacing ใช้ token ของ CalDay Design System (canvas, surface, line, primary-tint)
 */

const pulse = "animate-pulse motion-reduce:animate-none";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 md:py-12">
      {/* อ่านออกเสียงให้โปรแกรมอ่านหน้าจอ ส่วนโครงด้านล่างซ่อนไว้ */}
      <div role="status">
        <span className="sr-only">Loading dashboard...</span>
      </div>

      {/* ── Background decoration เหมือนหน้าจริง ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div aria-hidden="true" className="relative mx-auto max-w-280">
        {/* ── Header skeleton ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            {/* Label เล็ก ๆ "Daily dashboard" */}
            <div className={`h-4 w-28 rounded bg-line ${pulse}`} />
            {/* Heading "Your nutrition overview" */}
            <div className={`h-9 w-64 max-w-full rounded-lg bg-line ${pulse}`} />
          </div>
          {/* ปุ่ม Add meal + View profile */}
          <div className="flex gap-3">
            <div className={`h-11 w-28 rounded-xl bg-primary-tint ${pulse}`} />
            <div className={`h-11 w-32 rounded-xl bg-primary-tint ${pulse}`} />
          </div>
        </div>

        {/* ── Grid layout เหมือนหน้าจริง: main + sidebar ── */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ── Main section ── */}
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
            {/* Avatar + ชื่อผู้ใช้ */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className={`h-16 w-16 shrink-0 rounded-full bg-primary-tint ${pulse}`} />
              <div className="flex-1 space-y-3">
                <div className={`h-4 w-24 rounded bg-line ${pulse}`} />
                <div className={`h-7 w-48 max-w-full rounded-lg bg-line ${pulse}`} />
                <div className={`h-4 w-full max-w-md rounded bg-primary-tint ${pulse}`} />
              </div>
            </div>

            {/* Progress — Calories & Protein */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                { key: "calories", fill: "w-2/3" },
                { key: "protein", fill: "w-1/2" },
              ].map((tile) => (
                <div key={tile.key} className="rounded-xl border border-line bg-canvas p-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-4 w-20 rounded bg-line ${pulse}`} />
                    <div className={`h-4 w-16 rounded bg-line ${pulse}`} />
                  </div>
                  <div className={`mt-3 h-9 w-32 rounded-lg bg-primary-tint ${pulse}`} />
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-tint">
                    <div className={`h-full ${tile.fill} rounded-full bg-line ${pulse}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Stat cards — Goal, BMI, Status */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 rounded-xl border border-line bg-canvas p-4">
                  <div className={`h-4 w-12 rounded bg-line ${pulse}`} />
                  <div className={`h-5 w-20 rounded bg-primary-tint ${pulse}`} />
                </div>
              ))}
            </div>

            {/* Personal details */}
            <div className="mt-6 rounded-xl border border-line bg-canvas p-4 md:p-5">
              <div className={`h-5 w-32 rounded bg-line ${pulse}`} />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className={`h-4 w-16 rounded bg-line ${pulse}`} />
                    <div className={`h-5 w-24 rounded bg-primary-tint ${pulse}`} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            {/* Quick insights card */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <div className={`h-6 w-32 rounded bg-line ${pulse}`} />
              <div className="mt-3 divide-y divide-line">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className={`h-4 w-10 rounded bg-line ${pulse}`} />
                    <div className={`h-4 w-14 rounded bg-primary-tint ${pulse}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Next step card */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <div className={`h-6 w-24 rounded bg-line ${pulse}`} />
              <div className="mt-3 space-y-2">
                <div className={`h-4 w-full rounded bg-primary-tint ${pulse}`} />
                <div className={`h-4 w-4/5 rounded bg-primary-tint ${pulse}`} />
              </div>
              <div className={`mt-5 h-11 w-32 rounded-xl bg-primary-tint ${pulse}`} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}