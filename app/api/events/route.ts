// ตัวกลางระหว่าง Redis กับ Browser

import { subscribeEvents } from "@/lib/realtime/subscriber";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
    const session = await getSession();

    if (!session) {
        return new Response("Unauthorized", {
            status: 401,
        });
    }

    // SSE ต้องส่งข้อมูลเป็น bytes ให้ ReadableStream 
    const encoder = new TextEncoder();

    let unsubscribe: (() => Promise<void>) | undefined;

    // สร้าง Stream
    // สร้างช่องทางที่สามารถ ส่งข้อมูลไป Browser ทีละชุดในภายหลัง ได้
    const stream = new ReadableStream({
        // start คือฟังก์ชันที่ทำงานตอน Stream เริ่มทำงาน
        async start(controller) {

            // ✅ ผูก cleanup กับ AbortSignal ของ request
            // จะ fire ทันทีที่ connection ตัด ไม่ว่าจะด้วยสาเหตุอะไร
            // (Browser crash, Network หลุด, Tab ปิด ฯลฯ)
            request.signal.addEventListener("abort", async () => {
                await unsubscribe?.();
                // ✅ ป้องกัน ERR_INVALID_STATE กรณี cancel() ปิด controller ไปแล้ว
                // ก่อนที่ abort event จะ fire ตามมา
                try { controller.close(); } catch { /* already closed */ }
            });

            // subscribeEvents คือฟังก์ชันที่รับ callback function
            unsubscribe = await subscribeEvents((event) => {

                // ถ้า connection ถูกตัดแล้ว ไม่ต้องทำอะไรต่อ
                if (request.signal.aborted) return;

                // ส่ง Event เฉพาะ User คนนั้น
                if (Number(event.userId) !== session.user.id) {
                    return;
                }

                // SSE ใช้ data: เพื่อบอกว่าเป็น event data
                const data = `data: ${JSON.stringify(event)}\n\n`;

                // ส่ง Event เข้า Stream
                controller.enqueue(encoder.encode(data));
            });

            // heartbeat
            const heartbeatInterval = setInterval(() => {
                // ส่งเป็น event ชนิด heartbeat
                const data = `event: heartbeat\ndata: {"time": "${new Date().toISOString()}"}\n\n`;

                // หรือส่งเป็นแค่ comment เปล่าๆ ของ SSE ก็ได้ (ช่วยลดภาระ client ไม่ต้องมารับ event)
                // const data = `: heartbeat\n\n`; 

                controller.enqueue(encoder.encode(data));
            }, 30000); // 30 วินาที

            // จัดการตอน Client กดปิดหน้าเว็บ (Disconnect)
            // cleanup interval เมื่อ stream ถูกยกเลิก
            // ป้องกัน memory leak
            request.signal.addEventListener("abort", () => {
                clearInterval(heartbeatInterval);
            });
        },

        // cancel() จะถูกเรียกตอน Browser ปิด connection อย่างถูกต้อง (graceful close)
        async cancel() {
            await unsubscribe?.();
        },
    });

    return new Response(stream, {
        headers: {
            // บอก Browser ว่าเป็น Stream Event
            "Content-Type": "text/event-stream",
            // ไม่ให้ Cache
            "Cache-Control": "no-cache, no-transform",
            // ให้เชื่อมต่อค้างไว้
            "Connection": "keep-alive",
        },
    });
}