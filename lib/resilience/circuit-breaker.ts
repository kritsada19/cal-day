type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private firstFailureAt: number | null = null;
  private openedAt = 0;
  private halfOpenCalls = 0;
  private readonly threshold: number;
  private readonly windowMs: number;
  private readonly cooldownMs: number;
  private readonly halfOpenMaxCalls: number;

  constructor({
    threshold = 5,
    windowMs = 30_000, // 30,000 milliseconds หรือ 30 วินาที
    cooldownMs = 30_000,
    halfOpenMaxCalls = 1,
  } = {}) {
    this.threshold = threshold;
    this.windowMs = windowMs;
    this.cooldownMs = cooldownMs;
    this.halfOpenMaxCalls = halfOpenMaxCalls;
  }

  private resetWindowIfExpired(now = Date.now()) {
    // ถ้าสถานะไม่ใช่ closed หรือ failureCount เป็น 0 หรือ firstFailureAt เป็น null ให้ return ออกไป
    // closed ผ่านได้
    if (
      this.state !== "closed" ||
      this.failureCount === 0 ||
      this.firstFailureAt === null
    ) {
      return;
    }

    // ถ้าเวลาที่ผ่านไปมากกว่าหรือเท่ากับ windowMs ให้รีเซ็ต failureCount และ firstFailureAt
    if (now - this.firstFailureAt >= this.windowMs) {
      this.failureCount = 0;
      this.firstFailureAt = null;
    }
  }

  canExecute(): boolean {
    // รีเซ็ตหน้าต่างเวลา (window) ถ้าหากเวลาที่ผ่านไปมากกว่าหน้าต่างเวลา
    this.resetWindowIfExpired();

    if (this.state === "open") {
      const elapsed = Date.now() - this.openedAt;
      // ถ้าเวลาที่ผ่านไปมากกว่าหรือเท่ากับ cooldownMs ให้เปลี่ยนสถานะเป็น half-open และอนุญาตให้เรียกใช้งานได้
      if (elapsed >= this.cooldownMs) {
        this.state = "half-open";
        this.halfOpenCalls = 1; // นับ request นี้ด้วย
        return true;
      }
      return false;
    }

    if (this.state === "half-open") {
      if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
        return false;
      }

      this.halfOpenCalls++;
      return true;
    }

    return true;
  }

  // ถ้าเรียกใช้งานสำเร็จ ให้รีเซ็ต failureCount และเปลี่ยนสถานะเป็น closed
  recordSuccess() {
    this.failureCount = 0;
    this.firstFailureAt = null;
    this.state = "closed";
    this.halfOpenCalls = 0;
  }

  // ถ้าเรียกใช้งานล้มเหลว ให้เพิ่ม failureCount และตรวจสอบว่าควรเปลี่ยนสถานะเป็น open หรือไม่
  recordFailure() {
    const now = Date.now();

    this.resetWindowIfExpired(now);

    if (this.state === "half-open") {
      this.state = "open";
      this.openedAt = now;
      this.halfOpenCalls = 0;
      return;
    }

    // บันทึกเวลาที่เกิดความล้มเหลวครั้งแรก ถ้ายังไม่มีการบันทึก
    if (this.firstFailureAt === null) {
      this.firstFailureAt = now;
    }

    this.failureCount += 1;

    if (this.failureCount >= this.threshold) {
      this.state = "open";
      this.openedAt = now;
      this.halfOpenCalls = 0;
    }
  }

  // รีเซ็ตสถานะของ Circuit Breaker กลับไปเป็น closed และล้างค่า failureCount และ openedAt
  reset() {
    this.state = "closed";
    this.failureCount = 0;
    this.firstFailureAt = null;
    this.openedAt = 0;
    this.halfOpenCalls = 0;
  }
}
