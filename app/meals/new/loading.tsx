/**
 * New Meal Loading Skeleton
 * ─────────────────────────
 * Next.js จะแสดงไฟล์นี้ขณะโหลดหน้า /meals/new
 *
 * จำลองโครงสร้าง:
 *   - Header (ชื่อ "Record your meal" + ปุ่มกลับ dashboard)
 *   - ฟอร์ม: dropdown เลือกมื้ออาหาร, textarea อธิบายอาหาร, ปุ่ม Save
 *
 * ใช้ animate-pulse กับ border style เดียวกับหน้าจริง
 */

export default function NewMealLoading() {
  return (
    <div className="min-h-[85vh] flex-1 px-4 py-10 md:py-16 bg-[#f8f6f1] dark:bg-obsidian-950">
      <div className="mx-auto max-w-3xl rounded border border-black/10 dark:border-white/10 bg-white/80 dark:bg-obsidian-900 p-6 shadow-glow-gold md:p-8">
        {/* ── Header: ชื่อหน้า + ปุ่มกลับ ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            {/* "Add meal" label */}
            <div className="h-3 w-20 rounded bg-gold-accent/20 animate-pulse" />
            {/* "Record your meal" heading */}
            <div className="h-8 w-56 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          {/* ปุ่ม "Back to dashboard" */}
          <div className="h-9 w-40 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 animate-pulse" />
        </div>

        {/* ── Form skeleton ── */}
        <div className="mt-8 space-y-5">
          {/* Meal type dropdown */}
          <div className="space-y-2">
            <div className="h-2.5 w-20 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-12 w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 animate-pulse" />
          </div>

          {/* Food description textarea */}
          <div className="space-y-2">
            <div className="h-2.5 w-32 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-36 w-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-obsidian-950 animate-pulse" />
          </div>

          {/* Save button */}
          <div className="h-12 w-full border border-gold-accent/20 bg-gold-accent/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
