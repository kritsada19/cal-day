/**
 * Profile Loading Skeleton
 * ────────────────────────
 * Next.js จะแสดงไฟล์นี้ขณะโหลดหน้า /profile
 *
 * จำลองโครงสร้างหน้า profile:
 *   - Header (ชื่อ + ปุ่มกลับ)
 *   - Main section (avatar ใหญ่, ข้อมูลโปรไฟล์, BMI card, personal details)
 *   - Sidebar (account details + quick actions)
 *
 * ทุก skeleton block ใช้ animate-pulse กับสีที่เข้ากับ design system
 */

export default function ProfileLoading() {
  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 relative overflow-hidden bg-obsidian-950">
      {/* ── Background decorations ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[3rem_3rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="mx-auto max-w-5xl relative">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            {/* "Your profile" label */}
            <div className="h-3 w-24 rounded bg-gold-accent/20 animate-pulse" />
            {/* "Your account" heading */}
            <div className="h-8 w-52 rounded bg-white/10 animate-pulse" />
          </div>
          {/* ปุ่ม Back to home */}
          <div className="h-9 w-32 border border-white/10 bg-obsidian-900 animate-pulse" />
        </div>

        {/* ── Grid: main + sidebar ── */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ── Main section ── */}
          <section className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6 shadow-glow-gold md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_45%)] pointer-events-none" />
            {/* มุมตกแต่ง */}
            <span className="absolute -top-px -left-px h-3 w-3 border-l border-t border-gold-accent" />
            <span className="absolute -top-px -right-px h-3 w-3 border-r border-t border-gold-accent" />
            <span className="absolute -bottom-px -left-px h-3 w-3 border-b border-l border-gold-accent" />
            <span className="absolute -bottom-px -right-px h-3 w-3 border-b border-r border-gold-accent" />

            {/* Avatar + ข้อมูลผู้ใช้ */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              {/* Avatar ใหญ่กว่า dashboard (24x24 = 96px) */}
              <div className="h-24 w-24 border border-gold-accent/30 bg-obsidian-950 animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
                <div className="h-7 w-52 rounded bg-white/15 animate-pulse" />
                <div className="h-4 w-56 rounded bg-white/8 animate-pulse" />
                {/* Badge + button row */}
                <div className="flex flex-wrap gap-3 mt-1">
                  <div className="h-7 w-32 border border-emerald-accent/20 bg-emerald-glow animate-pulse" />
                  <div className="h-7 w-36 border border-gold-accent/20 bg-gold-accent/5 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Profile summary card */}
            <div className="mt-8 rounded border border-white/10 bg-obsidian-950/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="h-2.5 w-28 rounded bg-white/10 animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-gold-accent/20 animate-pulse" />
              </div>

              {/* BMI card + details grid */}
              <div className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                {/* BMI card skeleton */}
                <div className="rounded border border-white/10 bg-obsidian-900 p-4 space-y-3">
                  <div className="h-2.5 w-8 rounded bg-white/10 animate-pulse" />
                  <div className="h-9 w-16 rounded bg-white/15 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
                </div>

                {/* Personal details grid */}
                <div className="rounded border border-white/10 bg-obsidian-900 p-4">
                  {/* Goal highlight */}
                  <div className="mb-4 rounded border border-gold-accent/20 bg-obsidian-950/70 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-2.5 w-10 rounded bg-white/10 animate-pulse" />
                      <div className="h-2.5 w-24 rounded bg-gold-accent/20 animate-pulse" />
                    </div>
                    <div className="h-3.5 w-full rounded bg-white/8 animate-pulse" />
                  </div>
                  {/* 2x3 grid ข้อมูลส่วนตัว */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-2 w-16 rounded bg-white/10 animate-pulse" />
                        <div className="h-4 w-20 rounded bg-white/15 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Sidebar ── */}
          <aside className="space-y-6">
            {/* Account details card */}
            <div className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6">
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

              <div className="h-2.5 w-28 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 space-y-3">
                {["USER ID", "ROLE", "AI REMAINING"].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0">
                    <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                    <div className="h-3 w-14 rounded bg-white/15 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions card */}
            <div className="relative overflow-hidden border border-white/10 bg-obsidian-900 p-6">
              <span className="absolute -top-px -left-px h-2.5 w-2.5 border-l border-t border-gold-accent" />
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-gold-accent" />

              <div className="h-2.5 w-24 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 space-y-3">
                {/* Log out button skeleton */}
                <div className="h-11 w-full border border-gold-accent/20 bg-gold-accent/5 animate-pulse" />
                {/* Go to home button skeleton */}
                <div className="h-11 w-full border border-white/10 bg-obsidian-950 animate-pulse" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
