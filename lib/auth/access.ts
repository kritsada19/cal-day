import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

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
export async function requireAuth(): Promise<SessionGuardResult> {
  const session = await getSession();

  if (!session?.user?.id) {
    logAuditEvent({
      event: "admin_access_denied",
      status: 401,
      action: "require_auth",
      details: { reason: "missing_session" },
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
export async function requireAdmin(): Promise<SessionGuardResult> {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth;
  }

  if (auth.session.user.role !== "ADMIN") {
    logAuditEvent({
      event: "admin_access_denied",
      userId: auth.session.user.id,
      status: 403,
      action: "admin_required",
      details: {
        actualRole: auth.session.user.role ?? "unknown",
      },
    });

    return {
      ok: false,
      response: NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  logAuditEvent({
    event: "admin_access_granted",
    userId: auth.session.user.id,
    status: 200,
    action: "admin_required",
    details: {
      role: auth.session.user.role,
    },
  });

  return auth;
}
