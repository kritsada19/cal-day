/**
 * รวม "การคำนวณช่วงเวลา" ที่ใช้ร่วมกันหลายที่
 *
 * ทำไมต้องใช้เวลาแบบ UTC (ไม่ใช้เวลาท้องถิ่นของเครื่อง)?
 * เพราะตอนบันทึกมื้ออาหาร เราเก็บ DailySummary.date เป็น "เที่ยงคืน UTC ของวันนั้น"
 * ถ้าที่หนึ่งใช้เวลาท้องถิ่น อีกที่หนึ่งใช้ UTC ข้อมูลจะเหลื่อมกัน (เช่น มื้อดึก ๆ ไปโผล่อีกวัน)
 */

export function getUtcDayRange(dateInput: string | Date = new Date()) {
  const base =
    typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const date = base.getUTCDate();

  return {
    startOfDay: new Date(Date.UTC(year, month, date)),
    endOfDay: new Date(Date.UTC(year, month, date + 1)),
  };
}

/**
 * ช่วงเวลาของ "หนึ่งเดือน" แบบ UTC
 * หมายเหตุ: เดือนที่รับเข้ามาเป็นแบบคนใช้ (1 = มกราคม ... 12 = ธันวาคม)
 * แต่ Date.UTC ใช้ month แบบ 0-11 จึงต้องลบ 1
 */
export function getUtcMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    // วันที่ 0 ของเดือนถัดไป = วันสุดท้ายของเดือนนี้ (เช่น Date.UTC(2026, 8, 0) = 31 ส.ค. 2026)
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}
