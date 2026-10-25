/**
 * New Meal Loading Skeleton
 * ─────────────────────────
 * Next.js จะแสดงไฟล์นี้ขณะโหลดหน้า /meals/new
 *
 * จำลองโครงสร้าง:
 *   - Header (ชื่อ "Record your meal" + ปุ่มกลับ dashboard)
 *   - ฟอร์ม: dropdown เลือกมื้ออาหาร, ปุ่มสลับโหมด, textarea อธิบายอาหาร, ปุ่ม Save
 *
 * ใช้ animate-pulse (ปิดอัตโนมัติเมื่อผู้ใช้ตั้งค่า reduced motion)
 * สีและ spacing ใช้ token ของ CalDay Design System
 */

const pulse = "animate-pulse motion-reduce:animate-none";

export default function NewMealLoading() {
  return (
    <div className="relative min-h-[85vh] flex-1 overflow-hidden bg-canvas px-4 py-8 md:py-12">
      {/* อ่านออกเสียงให้โปรแกรมอ่านหน้าจอ ส่วนโครงด้านล่างซ่อนไว้ */}
      <div role="status">
        <span className="sr-only">Loading meal form...</span>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-xl max-w-full -translate-x-1/2 rounded-full bg-highlight/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="relative mx-auto max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8"
      >
        {/* ── Header: ชื่อหน้า + ปุ่มกลับ ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            {/* "Add meal" label */}
            <div className={`h-4 w-20 rounded bg-line ${pulse}`} />
            {/* "Record your meal" heading */}
            <div className={`h-9 w-60 max-w-full rounded-lg bg-line ${pulse}`} />
          </div>
          {/* ปุ่ม "Back to dashboard" */}
          <div className={`h-11 w-44 rounded-xl bg-primary-tint ${pulse}`} />
        </div>

        {/* ── Form skeleton ── */}
        <div className="mt-8 space-y-6">
          {/* Meal type dropdown */}
          <div className="space-y-2">
            <div className={`h-4 w-20 rounded bg-line ${pulse}`} />
            <div className={`h-12 w-full rounded-xl bg-primary-tint ${pulse}`} />
          </div>

          {/* Mode toggle (Text / Image) */}
          <div className={`h-13 w-52 rounded-xl bg-primary-tint ${pulse}`} />

          {/* Food description textarea */}
          <div className="space-y-2">
            <div className={`h-4 w-32 rounded bg-line ${pulse}`} />
            <div className={`h-40 w-full rounded-xl bg-primary-tint ${pulse}`} />
            <div className={`h-4 w-3/4 rounded bg-line ${pulse}`} />
          </div>

          {/* Save button */}
          <div className={`h-12 w-full rounded-xl bg-primary-tint ${pulse}`} />
        </div>
      </div>
    </div>
  );
}