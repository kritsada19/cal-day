/**
 * Profile Loading Skeleton
 * ────────────────────────
 * Next.js จะแสดงไฟล์นี้ขณะโหลดหน้า /profile
 *
 * จำลองโครงสร้างหน้า profile:
 *   - Header (ชื่อ + ปุ่มกลับ)
 *   - Main section (avatar, ข้อมูลโปรไฟล์, BMI card, personal details)
 *   - Sidebar (account details + quick actions)
 *
 * ทุก skeleton block ใช้ animate-pulse (ปิดอัตโนมัติเมื่อผู้ใช้ตั้งค่า reduced motion)
 * สีและ spacing ใช้ token ของ CalDay Design System
 */

const pulse = "animate-pulse motion-reduce:animate-none";

export default function ProfileLoading() {
  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 md:py-12">
      {/* อ่านออกเสียงให้โปรแกรมอ่านหน้าจอ ส่วนโครงด้านล่างซ่อนไว้ */}
      <div role="status">
        <span className="sr-only">Loading profile...</span>
      </div>

      {/* ── Background decoration ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div aria-hidden="true" className="relative mx-auto max-w-280">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            {/* "Your profile" label */}
            <div className={`h-4 w-24 rounded bg-line ${pulse}`} />
            {/* "Your account" heading */}
            <div className={`h-9 w-52 rounded-lg bg-line ${pulse}`} />
          </div>
          {/* ปุ่ม Back to home */}
          <div className={`h-11 w-36 rounded-xl bg-primary-tint ${pulse}`} />
        </div>

        {/* ── Grid: main + sidebar ── */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ── Main section ── */}
          <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
            {/* Avatar + ข้อมูลผู้ใช้ */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className={`h-20 w-20 shrink-0 rounded-full bg-primary-tint ${pulse}`} />
              <div className="flex-1 space-y-3">
                <div className={`h-4 w-28 rounded bg-line ${pulse}`} />
                <div className={`h-7 w-52 max-w-full rounded-lg bg-line ${pulse}`} />
                <div className={`h-5 w-56 max-w-full rounded bg-primary-tint ${pulse}`} />
                {/* Badge + button row */}
                <div className="mt-1 flex flex-wrap gap-3">
                  <div className={`h-8 w-28 rounded-full bg-primary-tint ${pulse}`} />
                  <div className={`h-11 w-40 rounded-xl bg-primary-tint ${pulse}`} />
                </div>
              </div>
            </div>

            {/* Profile summary card */}
            <div className="mt-8 rounded-xl border border-line bg-canvas p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className={`h-5 w-32 rounded bg-line ${pulse}`} />
                <div className={`h-5 w-20 rounded bg-line ${pulse}`} />
              </div>

              {/* BMI card + details grid */}
              <div className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                {/* BMI card skeleton */}
                <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
                  <div className={`h-4 w-10 rounded bg-line ${pulse}`} />
                  <div className={`h-9 w-16 rounded-lg bg-primary-tint ${pulse}`} />
                  <div className={`h-5 w-24 rounded bg-line ${pulse}`} />
                </div>

                {/* Personal details grid */}
                <div className="rounded-xl border border-line bg-surface p-4">
                  {/* Goal highlight */}
                  <div className="mb-4 space-y-2 rounded-xl border border-line bg-canvas p-3">
                    <div className="flex items-center justify-between">
                      <div className={`h-4 w-10 rounded bg-line ${pulse}`} />
                      <div className={`h-4 w-24 rounded bg-line ${pulse}`} />
                    </div>
                    <div className={`h-4 w-full rounded bg-primary-tint ${pulse}`} />
                  </div>
                  {/* 2x3 grid ข้อมูลส่วนตัว */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className={`h-4 w-16 rounded bg-line ${pulse}`} />
                        <div className={`h-5 w-20 rounded bg-primary-tint ${pulse}`} />
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
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <div className={`h-6 w-36 rounded bg-line ${pulse}`} />
              <div className="mt-3 divide-y divide-line">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className={`h-4 w-20 rounded bg-line ${pulse}`} />
                    <div className={`h-4 w-14 rounded bg-primary-tint ${pulse}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions card */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <div className={`h-6 w-32 rounded bg-line ${pulse}`} />
              <div className="mt-4 space-y-3">
                {/* Log out button skeleton */}
                <div className={`h-11 w-full rounded-xl bg-primary-tint ${pulse}`} />
                {/* Go to home button skeleton */}
                <div className={`h-11 w-full rounded-xl bg-primary-tint ${pulse}`} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}