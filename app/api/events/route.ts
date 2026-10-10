
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
    let heartbeatInterval:
        | ReturnType<typeof setInterval>
        | undefined;

    // ตรวจสอบว่า Stream ปิดแล้วหรือยัง
    let isClosed = false;

    // ป้องกัน cleanup ทำงานซ้ำ
    let cleanupPromise: Promise<void> | undefined;

    // สร้าง Stream
    // สร้างช่องทางที่สามารถ ส่งข้อมูลไป Browser ทีละชุดในภายหลัง ได้
    const stream = new ReadableStream<Uint8Array>({
        // start คือฟังก์ชันที่ทำงานตอน Stream เริ่มทำงาน
        async start(controller) {

            // Cleanup resource ทั้งหมดเมื่อ Client disconnect
            const cleanup = (): Promise<void> => {
                isClosed = true;

                if (heartbeatInterval !== undefined) {
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = undefined;
                }

                if (!cleanupPromise) {
                    cleanupPromise = (async () => {
                        await unsubscribe?.();
                        unsubscribe = undefined;
                    })();
                }

                return cleanupPromise;
            };

            // ส่งข้อมูลเข้า Stream เฉพาะเมื่อยังเปิดอยู่
            const send = (data: string) => {
                if (isClosed || request.signal.aborted) return;

                try {
                    controller.enqueue(encoder.encode(data));
                } catch {
                    // Stream ปิดไปแล้ว จึงหยุดส่งข้อมูลและ cleanup
                    void cleanup();
                }
            };

            // ✅ ผูก cleanup กับ AbortSignal ของ request
            // จะ fire ทันทีที่ connection ตัด ไม่ว่าจะด้วยสาเหตุอะไร
            // (Browser crash, Network หลุด, Tab ปิด ฯลฯ)
            request.signal.addEventListener("abort", () => {
                void cleanup();
            }, { once: true });

            try {
                // ป้องกันกรณี Client disconnect ก่อนเริ่ม subscribe
                if (isClosed || request.signal.aborted) {
                    await cleanup();
                    return;
                }

                // subscribeEvents คือฟังก์ชันที่รับ callback function
                unsubscribe = await subscribeEvents((event) => {

                    // ถ้า connection ถูกตัดแล้ว ไม่ต้องทำอะไรต่อ
                    if (isClosed || request.signal.aborted) return;

                    // ส่ง Event เฉพาะ User คนนั้น
                    if (Number(event.userId) !== session.user.id) {
                        return;
                    }

                    // SSE ใช้ data: เพื่อบอกว่าเป็น event data
                    const data = `data: ${JSON.stringify(event)}\n\n`;

                    // ส่ง Event เข้า Stream
                    send(data);
                });

                // ป้องกันกรณี Client disconnect ระหว่าง subscribeEvents()
                if (isClosed || request.signal.aborted) {
                    await cleanup();
                    return;
                }

                // heartbeat
                heartbeatInterval = setInterval(() => {
                    // ส่งเป็น event ชนิด heartbeat
                    const data = `event: heartbeat\ndata: {"time": "${new Date().toISOString()}"}\n\n`;

                    // หรือส่งเป็นแค่ comment เปล่าๆ ของ SSE ก็ได้ (ช่วยลดภาระ client ไม่ต้องมารับ event)
                    // const data = `: heartbeat\n\n`;

                    send(data);
                }, 30000); // 30 วินาที

                // จัดการตอน Client กดปิดหน้าเว็บ (Disconnect)
                // cleanup interval เมื่อ stream ถูกยกเลิก
                // ป้องกัน memory leak
                // จัดการผ่าน cleanup() ด้านบนแล้ว
            } catch (error) {
                await cleanup();

                try {
                    controller.error(error);
                } catch {
                    // Stream อาจถูกปิดไปแล้ว
                }
            }
        },

        // cancel() จะถูกเรียกตอน Browser ปิด connection อย่างถูกต้อง (graceful close)
        async cancel() {
            isClosed = true;

            if (heartbeatInterval !== undefined) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = undefined;
            }

            if (!cleanupPromise) {
                cleanupPromise = (async () => {
                    await unsubscribe?.();
                    unsubscribe = undefined;
                })();
            }

            await cleanupPromise;
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