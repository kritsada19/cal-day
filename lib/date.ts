/**
 * รวม "การคำนวณช่วงเวลา" ที่ใช้ร่วมกันหลายที่
 *
 * ทำไมต้องใช้เวลาแบบ UTC (ไม่ใช้เวลาท้องถิ่นของเครื่อง)?
 * เพราะตอนบันทึกมื้ออาหาร เราเก็บ DailySummary.date เป็น "เที่ยงคืน UTC ของวันนั้น"
 * ถ้าที่หนึ่งใช้เวลาท้องถิ่น อีกที่หนึ่งใช้ UTC ข้อมูลจะเหลื่อมกัน (เช่น มื้อดึก ๆ ไปโผล่อีกวัน)
 */

/** ช่วงเวลาของ "หนึ่งวัน" แบบ UTC เช่น 2026-08-26 → 00:00:00.000Z ถึง 23:59:59.999Z */
export function getUtcDayRange(dateInput?: string | Date) {
  let year: number;
  let month: number;
  let date: number;

  if (typeof dateInput === "string") {
    // ถ้ารูปแบบเป็น YYYY-MM-DD
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10) - 1;
      date = parseInt(match[3], 10);
    } else {
      const parsed = new Date(dateInput);
      year = parsed.getUTCFullYear();
      month = parsed.getUTCMonth();
      date = parsed.getUTCDate();
    }
  } else if (dateInput instanceof Date) {
    year = dateInput.getUTCFullYear();
    month = dateInput.getUTCMonth();
    date = dateInput.getUTCDate();
  } else {
    // ถ้าไม่ส่ง dateInput ให้ใช้เวลาปัจจุบัน แต่คำนวณตาม Local timezone ของเครื่อง/เซิร์ฟเวอร์
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
    date = now.getDate();
  }

  return {
    // ต้นวัน: 00:00:00.000 UTC
    startOfDay: new Date(Date.UTC(year, month, date, 0, 0, 0, 0)),
    // สิ้นวัน: 23:59:59.999 UTC
    endOfDay: new Date(Date.UTC(year, month, date, 23, 59, 59, 999)),
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
