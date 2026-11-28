import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/db/redis";

/**
 * สถานะของ request ที่เก็บใน Redis:
 * - processing: กำลังประมวลผลอยู่ (กัน request ซ้ำที่ยิงเข้ามาพร้อมกัน)
 * - done: ประมวลผลเสร็จแล้ว พร้อมเก็บ httpStatus และ body ไว้คืนให้ retry
 */
type CachedResult =
    | { status: "processing" }
    | { status: "done"; httpStatus: number; body: unknown };

/**
 * ครอบ API handler เพื่อป้องกันการทำงานซ้ำเมื่อ client ส่ง header `Idempotency-Key` เดิมมา
 * (เช่น กดปุ่มเบิ้ล หรือ network retry)
 */
export async function withIdempotency(
    req: NextRequest,
    scope: string,
    userId: number | string,
    handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
    const key = req.headers.get("idempotency-key")?.trim();
    if (!key) return handler(); // ถ้า client ไม่ส่ง key มา ให้ทำงานปกติ

    // ผูก scope + userId เพื่อไม่ให้ user อื่นใช้ key ชนกันหรือขโมยผลลัพธ์กันได้
    const redisKey = `idem:${scope}:${userId}:${key}`;

    // จอง lock แบบ atomic ด้วย NX (Set if Not Exists) และตั้ง TTL 60 วินาทีกัน lock ค้าง
    const acquired = await redis.set(
        redisKey,
        JSON.stringify({ status: "processing" }),
        "EX",
        60,
        "NX",
    );

    if (!acquired) {
        // มี request ก่อนหน้าจอง key นี้ไว้แล้ว → เช็คว่าทำเสร็จหรือยัง
        const raw = await redis.get(redisKey);
        if (raw) {
            const cached = JSON.parse(raw) as CachedResult;
            if (cached.status === "done") {
                // ทำเสร็จแล้ว → คืนผลลัพธ์เดิมทันทีโดยไม่รัน handler ซ้ำ
                return NextResponse.json(cached.body, { status: cached.httpStatus });
            }
        }
        // ยังไม่เสร็จ (processing) → ตอบ 409 Conflict ให้ client รอหรือลองใหม่
        return NextResponse.json(
            { message: "Request already in progress" },
            { status: 409 },
        );
    }

    try {
        const res = await handler();
        if (res.status < 500) {
            // บันทึกผลลัพธ์ลง Redis 24 ชม. สำหรับ 2xx/4xx เพื่อให้ retry ได้คำตอบเดิม
            const body = await res.clone().json().catch(() => null);
            await redis.set(
                redisKey,
                JSON.stringify({ status: "done", httpStatus: res.status, body }),
                "EX",
                60 * 60 * 24,
            );
        } else {
            // 5xx เป็น error ฝั่ง server → ลบ lock ออกเพื่อให้ client retry ใหม่ได้
            await redis.del(redisKey);
        }
        return res;
    } catch (err) {
        // เกิด exception ระหว่างทำงาน → ลบ lock ทิ้งทันที
        await redis.del(redisKey);
        throw err;
    }
}