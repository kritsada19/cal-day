/**
 * AppError = ข้อผิดพลาดที่ "เราตั้งใจสร้างขึ้น" พร้อมบอกว่าเป็นความผิดของใคร
 * เช่น 400 (ข้อมูลส่งมาผิด), 404 (ไม่พบข้อมูล), 429 (ใช้เกินโควต้า)
 *
 * ทำไมไม่ return NextResponse ตรง ๆ จาก service?
 * เพราะ service ไม่ควรรู้จัก HTTP — มันแค่ "โยน error" ออกมา
 * แล้วให้ route handler (ชั้น HTTP) เป็นคนแปลงเป็น status code + JSON เอง
 */
export class AppError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

/** ตรวจว่า error ที่จับได้เป็น AppError หรือไม่ (ใช้ในชั้น HTTP) */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
