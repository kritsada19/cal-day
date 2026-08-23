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
 * ใช้ animate-pulse เพื่อทำเอฟเฟกต์กะพริบ
 * สีและ spacing ดึงจาก design system เดิม (obsidian, gold-accent)
 */

export default function DashboardLoading() {
  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 relative overflow-hidden bg-obsidian-950">
      {/* ── Background decorations เหมือนหน้าจริง ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="mx-auto max-w-6xl relative">
        {/* ── Header skeleton ── */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            {/* Label เล็ก ๆ "Daily dashboard" */}
            <div className="h-3 w-28 rounded bg-gold-accent/20 animate-pulse" />
            {/* Heading "Your nutrition overview" */}
            <div className="h-8 w-64 rounded bg-white/10 animate-pulse" />
          </div>
          {/* ปุ่ม Add meal + View profile */}
          <div className="flex gap-3">
            <div className="h-9 w-24 border border-gold-accent/20 bg-gold-accent/5 animate-pulse" />
            <div className="h-9 w-28 border border-white/10 bg-obsidian-900 animate-pulse" />
          </div>
        </div>

        {/* ── Grid layout เหมือนหน้าจริง: main + sidebar ── */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ── Main section ── */}
          <section className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6 shadow-glow-gold md:p-8">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_45%)] pointer-events-none" />
            {/* มุมตกแต่ง (corner accents) */}
            <span className="absolute -top-px -left-px h-3 w-3 border-l border-t border-gold-accent" />
            <span className="absolute -top-px -right-px h-3 w-3 border-r border-t border-gold-accent" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b border-l border-gold-accent" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b border-r border-gold-accent" />

            {/* Avatar + ชื่อผู้ใช้ */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="h-20 w-20 border border-gold-accent/30 bg-obsidian-950 animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                <div className="h-7 w-48 rounded bg-white/15 animate-pulse" />
                <div className="h-4 w-72 rounded bg-white/8 animate-pulse" />
              </div>
            </div>

            {/* Progress bars — Calories & Protein */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {/* Calorie progress skeleton */}
              <div className="rounded border border-gold-accent/20 bg-obsidian-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-16 rounded bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-20 rounded bg-gold-accent/20 animate-pulse" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-gold-accent/30 animate-pulse" />
                </div>
                <div className="h-3.5 w-36 rounded bg-white/8 animate-pulse" />
              </div>
              {/* Protein progress skeleton */}
              <div className="rounded border border-emerald-accent/20 bg-obsidian-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-14 rounded bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-16 rounded bg-emerald-accent/20 animate-pulse" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/2 rounded-full bg-emerald-accent/30 animate-pulse" />
                </div>
                <div className="h-3.5 w-40 rounded bg-white/8 animate-pulse" />
              </div>
            </div>

            {/* Stat cards — Goal, BMI, Status */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded border border-white/10 bg-obsidian-950/60 p-4 space-y-3">
                  <div className="h-2.5 w-12 rounded bg-white/10 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-white/15 animate-pulse" />
                </div>
              ))}
            </div>

            {/* Personal details skeleton */}
            <div className="mt-6 rounded border border-white/10 bg-obsidian-950/60 p-4">
              <div className="h-2.5 w-28 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-2 w-14 rounded bg-white/10 animate-pulse" />
                    <div className="h-4 w-24 rounded bg-white/15 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            {/* Quick insights card */}
            <div className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6">
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

              <div className="h-2.5 w-24 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0">
                    <div className="h-3 w-10 rounded bg-white/10 animate-pulse" />
                    <div className="h-3 w-12 rounded bg-white/15 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Next step card */}
            <div className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6">
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

              <div className="h-2.5 w-20 rounded bg-white/10 animate-pulse" />
              <div className="mt-3 space-y-2">
                <div className="h-3.5 w-full rounded bg-white/8 animate-pulse" />
                <div className="h-3.5 w-4/5 rounded bg-white/8 animate-pulse" />
              </div>
              <div className="mt-5 h-9 w-28 border border-gold-accent/20 bg-gold-accent/5 animate-pulse" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
