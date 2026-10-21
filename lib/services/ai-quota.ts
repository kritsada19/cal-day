import { redis } from "@/lib/db/redis";
import { NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// AI QUOTA LIMITS
// ─────────────────────────────────────────────────────────────────────────────
// จำนวนครั้งสูงสุดที่ผู้ใช้แต่ละแผนสามารถเรียก AI ได้ต่อวัน
// ค่านี้ถูกใช้ทั้งใน check และ UI (เช่น progress bar ใน client)
export const AI_LIMIT_FREE = 5;
export const AI_LIMIT_PRO = 50;

// ─────────────────────────────────────────────────────────────────────────────
// REDIS KEY CONVENTION
// ─────────────────────────────────────────────────────────────────────────────
// Key รูปแบบ: ai_limit:<userId>
// - ค่าภายใน key คือตัวเลขจำนวนครั้งที่ user นั้นใช้ AI ไปแล้ววันนี้
// - Key จะหมดอายุอัตโนมัติเมื่อสิ้นสุด 24 ชั่วโมง (reset รายวัน)
function quotaKey(userId: number) {
    return `ai_limit:${userId}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// getUserAiQuota — อ่านสถานะ quota ของ user ณ ขณะนั้น (READ-ONLY)
// ─────────────────────────────────────────────────────────────────────────────
// ใช้สำหรับ:
//   - แสดง remaining ใน UI / API response
//   - ไม่ได้ consume quota
// หมายเหตุ: เนื่องจาก READ-ONLY จึงปลอดภัยสำหรับ concurrent access
export async function getUserAiQuota(userId: number, plan: string = "FREE") {
    const limit = plan === "PRO" ? AI_LIMIT_PRO : AI_LIMIT_FREE;

    // ดึงจำนวนครั้งที่ใช้ไปแล้วจาก Redis
    // ถ้า key ยังไม่มี (ยังไม่เคยใช้วันนี้) → ถือว่า usage = 0
    const countStr = await redis.get(quotaKey(userId));
    const usage = countStr ? parseInt(countStr, 10) : 0;

    return {
        usage,
        limit,
        remaining: Math.max(0, limit - usage),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// checkAndComsumeAiQuota — หักโควต้า 1 ครั้ง แล้วตรวจว่าเกินหรือไม่
// ─────────────────────────────────────────────────────────────────────────────
//
// ❗ ISOLATION LEVEL — ทำไมต้องระวังเรื่องนี้?
// ─────────────────────────────────────────────────────────────────────────────
// Next.js ทำงานบน serverless/edge runtime ซึ่งแต่ละ HTTP request
// อาจรันพร้อมกันบน instance หลายตัว (concurrent requests)
//
// ถ้าเขียนแบบ "อ่านก่อน แล้วค่อยเพิ่ม" (Read-then-Write):
//
//   const usage = await redis.get(key)   // Request A อ่านได้ 4
//   const usage = await redis.get(key)   // Request B อ่านได้ 4  ← ยังไม่ทันอัปเดต
//   // ทั้ง A และ B เห็น usage=4 จึงทั้งคู่ผ่าน check แล้วเรียก AI
//   // แต่ quota จริงควรให้ผ่านแค่ 1 ครั้ง!
//
// นี่คือ Race Condition แบบ TOCTOU (Time-of-Check to Time-of-Use)
//
// ─────────────────────────────────────────────────────────────────────────────
// ✅ วิธีแก้ — ใช้ Redis INCR ก่อนตรวจ (Write-then-Check)
// ─────────────────────────────────────────────────────────────────────────────
// Redis INCR เป็น atomic operation ที่ Redis รับประกันว่า:
//   "เพิ่มค่าและคืนผลลัพธ์ใหม่ในคำสั่งเดียว โดยไม่มี request อื่นแทรก"
//
// ดังนั้นถ้า 2 requests ส่งพร้อมกัน:
//   Request A: INCR → ได้ 5   (A รู้ว่าตัวเองเป็นครั้งที่ 5)
//   Request B: INCR → ได้ 6   (B รู้ว่าตัวเองเป็นครั้งที่ 6 → over limit)
//
// แต่ละ request จะได้ค่า usage ของตัวเองที่ไม่ซ้ำกัน
// ทำให้ check หลัง INCR ถูกต้องเสมอ — แก้ race condition ได้
//
// ─────────────────────────────────────────────────────────────────────────────
// ✅ DECR on Reject — คืน counter เมื่อ request ถูก reject
// ─────────────────────────────────────────────────────────────────────────────
// หลัง INCR ถ้าพบว่า over limit เราจะ DECR คืนก่อน return 429
// เพื่อให้ counter สะท้อน "จำนวนครั้งที่ใช้ AI จริง" เสมอ
// → getUserAiQuota จะแสดง remaining ถูกต้อง ไม่ติดลบ
//
// ทำไม concurrent DECR ยังปลอดภัย?
//   Usage = 5 (limit), A และ B ส่ง request พร้อมกัน:
//   A: INCR → 6  |  B: INCR → 7
//   A: DECR → 6  |  B: DECR → 5
//   Final = 5  ✓  (net INCR+DECR หักล้างกันเสมอ)
//
// Risk เดียวที่เหลือ: ถ้า DECR fail (Redis error หลัง INCR)
//   → counter ค้างสูงชั่วคราว แต่จะ reset เองเมื่อ TTL หมด (24h)
//   → impact เพียง display ไม่ใช่ security breach
//
export async function checkAndComsumeAiQuota(userId: number, plan: string = "FREE") {
    const key = quotaKey(userId);

    // ─── Step 1: Atomic Increment ─────────────────────────────────────────────
    // INCR คืนค่าตัวเลขหลังจากเพิ่มทันที (เช่น เพิ่มจาก 4 → คืน 5)
    // เป็น atomic ใน Redis: ไม่มี request อื่นได้ค่าเดียวกัน
    // เราใช้ค่านี้โดยตรงในการ check ไม่ต้อง GET แยก → ปิดช่องโหว่ race condition
    const currentUsage = await redis.incr(key);

    // ─── Step 2: Set TTL เฉพาะครั้งแรกของวัน ────────────────────────────────
    // currentUsage === 1 หมายความว่า key นี้ถูกสร้างใหม่ (เพิ่งเริ่มวันใหม่)
    // จึง set expiry 24 ชั่วโมง เพื่อให้ quota reset อัตโนมัติรายวัน
    //
    // ทำไมไม่ set expire ทุกครั้ง?
    //   - ถ้า set ทุก INCR จะ reset timer ทุกครั้ง → user ที่ใช้ใกล้ deadline
    //     จะได้ reset ช้าไปเรื่อย ๆ (sliding window ไม่ใช่ fixed window)
    //   - เราต้องการ fixed 24h window นับจากครั้งแรกที่ใช้ในวันนั้น
    if (currentUsage === 1) {
        await redis.expire(key, 60 * 60 * 24); // 86400 วินาที = 24 ชั่วโมง
    }

    // ─── Step 3: ตรวจว่า quota เกินหรือไม่ ───────────────────────────────────
    // ใช้ currentUsage ที่ได้จาก INCR โดยตรง ไม่ต้อง GET อีกรอบ
    // (ป้องกัน race condition เพิ่มเติม เพราะไม่มีการ GET แยก)
    if (plan === "FREE" && currentUsage > AI_LIMIT_FREE) {
        // ใช้งาน AI เกิน 5 ครั้ง/วัน → แนะนำให้ upgrade
        // DECR คืน counter เพราะ request นี้ถูก reject ไม่ได้ใช้ AI จริง
        // ทำให้ getUserAiQuota แสดง remaining ถูกต้อง (ไม่ติดลบ)
        await redis.decr(key);
        return NextResponse.json(
            { message: "AI limit reached. Please upgrade to premium to continue." },
            { status: 429 },
        );
    }

    if (plan === "PRO" && currentUsage > AI_LIMIT_PRO) {
        // ใช้งาน AI เกิน 50 ครั้ง/วัน → ติดต่อ support
        // DECR คืน counter เพราะ request นี้ถูก reject ไม่ได้ใช้ AI จริง
        await redis.decr(key);
        return NextResponse.json(
            { message: "Pro AI limit reached. Please contact support for assistance." },
            { status: 429 },
        );
    }

    // ─── ถ้าไม่เกิน quota → return undefined (caller ตีความว่า "ผ่าน") ───────
}
