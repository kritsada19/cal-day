import { logger } from "@/lib/logger";

export type AuditEventName =
  | "login_success"
  | "login_failed"
  | "login_blocked"
  | "admin_access_granted"
  | "admin_access_denied"
  | "admin_action"
  | "payment_initiated"
  | "payment_completed"
  | "payment_failed";

export interface AuditLogInput {
  event: AuditEventName;
  userId?: number | string | null;
  email?: string | null;
  ip?: string | null;
  status?: number;
  action?: string;
  details?: Record<string, unknown>;
  route?: string;
}

/**
 * รูปแบบของ Action ที่ Admin สามารถทำได้ในระบบ
 * จัดหมวดหมู่ชัดเจน: entity.operation
 */
export type AdminActionType =
  | "admin.access_granted"
  | "admin.access_denied"
  | "user.create"
  | "user.update"
  | "user.update_role"
  | "user.delete"
  | "food.create"
  | "food.update"
  | "food.delete"
  | "meal.delete"
  | "subscription.update"
  | "subscription.cancel";

export type AdminTargetType = "user" | "food" | "meal" | "subscription" | "system";

export interface AdminAuditLogInput {
  action: AdminActionType;
  adminId: number | string;
  adminEmail?: string | null;
  targetType: AdminTargetType;
  targetId: number | string;
  route: string;
  ip?: string | null;
  /**
   * User-Agent (UA): ข้อมูลเบราว์เซอร์/ระบบปฏิบัติการ/อุปกรณ์ของผู้เรียกใช้งาน (เช่น Chrome บน Windows, Safari บน iPhone)
   * มีประโยชน์ในการตรวจสอบความผิดปกติ เช่น ยิงมาจาก curl/python หรือล็อกอินจากอุปกรณ์แปลกปลอม
   */
  userAgent?: string | null;
  status: "success" | "failed";
  reason?: string;
  changes?: {
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  };
}

/**
 * Helper ดึงข้อมูล Context ของ Client จาก Request (IP, User-Agent, Path)
 * เพื่อใช้แนบไปกับ Audit Log โดยไม่ต้องเขียนซ้ำในทุก Route
 */
export function getClientContext(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  let route = "unknown";
  try {
    const url = new URL(request.url);
    route = url.pathname;
  } catch {
    // กรณี parsing URL ไม่สำเร็จ
  }

  return { ip, userAgent, route };
}

/**
 * Helper สำหรับ Audit Log ของ Admin โดยเฉพาะ
 * ให้ข้อมูลที่ครบถ้วน (Who, When, What, Target, Route, Changes)
 */
export function logAdminAction(input: AdminAuditLogInput) {
  logger.info(
    {
      event: "admin_action",
      timestamp: new Date().toISOString(),
      action: input.action,
      adminId: input.adminId,
      adminEmail: input.adminEmail,
      targetType: input.targetType,
      targetId: input.targetId,
      route: input.route,
      ip: input.ip,
      userAgent: input.userAgent,
      status: input.status,
      reason: input.reason,
      changes: input.changes,
    },
    `[ADMIN_AUDIT] Admin ${input.adminId} executed ${input.action} on ${input.targetType}:${input.targetId} (${input.status})`
  );
}

/**
 * ข้อ 5: เพิ่ม audit log + monitoring สำหรับเหตุการณ์สำคัญ
 * - login_success / login_failed / login_blocked
 * - payment_initiated / payment_completed / payment_failed
 * - admin_access_granted / admin_access_denied / admin_action
 *
 * Log ถูกจัดรูปแบบเป็น structured JSON เพื่อให้สามารถส่งไปยัง log aggregation,
 * alerting, SIEM หรือ monitoring pipeline ได้ง่ายและตรวจสอบได้ในภายหล+งัง
 */
export function logAuditEvent({
  event,
  userId,
  email,
  ip,
  status,
  action,
  details,
  route,
}: AuditLogInput) {
  logger.info(
    {
      event,
      userId,
      email,
      ip,
      status,
      action,
      route,
      ...details,
    },
    "audit_event"
  );
}

