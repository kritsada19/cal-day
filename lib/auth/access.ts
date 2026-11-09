import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { logAdminAction, logAuditEvent, getClientContext } from "@/lib/audit";

export type SessionGuardResult =
  | {
    ok: true;
    session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  }
  | {
    ok: false;
    response: NextResponse;
  };

/**
 * ตรวจว่า request มี session ที่ใช้งานได้หรือไม่
 * ถ้าไม่มี ให้คืน response 401 ทันที
 */
export async function requireAuth(request?: Request): Promise<SessionGuardResult> {
  const session = await getSession();
  const context = request ? getClientContext(request) : undefined;

  if (!session?.user?.id) {
    logAuditEvent({
      event: "admin_access_denied",
      status: 401,
      action: "require_auth",
      ip: context?.ip,
      route: context?.route,
      details: {
        reason: "missing_session",
        userAgent: context?.userAgent,
      },
    });

    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    session,
  };
}

/**
 * ตรวจว่า session นี้มีสิทธิ์เป็น admin หรือไม่
 * ใช้สำหรับ route ที่ต้องการ admin-only access
 */
export async function requireAdmin(request?: Request): Promise<SessionGuardResult> {
  const auth = await requireAuth(request);

  if (!auth.ok) {
    return auth;
  }

  const context = request ? getClientContext(request) : undefined;

  if (auth.session.user.role !== "ADMIN") {
    logAdminAction({
      action: "admin.access_denied",
      adminId: auth.session.user.id,
      adminEmail: auth.session.user.email,
      targetType: "system",
      targetId: "admin_route",
      route: context?.route ?? "unknown",
      ip: context?.ip,
      userAgent: context?.userAgent,
      status: "failed",
      reason: `Forbidden: role is ${auth.session.user.role ?? "unknown"}`,
    });

    return {
      ok: false,
      response: NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  logAdminAction({
    action: "admin.access_granted",
    adminId: auth.session.user.id,
    adminEmail: auth.session.user.email,
    targetType: "system",
    targetId: "admin_route",
    route: context?.route ?? "unknown",
    ip: context?.ip,
    userAgent: context?.userAgent,
    status: "success",
  });

  return auth;
}
