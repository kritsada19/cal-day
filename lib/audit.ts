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
 * ข้อ 5: เพิ่ม audit log + monitoring สำหรับเหตุการณ์สำคัญ
 * - login_success / login_failed / login_blocked
 * - payment_initiated / payment_completed / payment_failed
 * - admin_access_granted / admin_access_denied / admin_action
 *
 * Log ถูกจัดรูปแบบเป็น structured JSON เพื่อให้สามารถส่งไปยัง log aggregation,
 * alerting, SIEM หรือ monitoring pipeline ได้ง่ายและตรวจสอบได้ในภายหลัง
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
