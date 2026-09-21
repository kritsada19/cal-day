// ตัวกลางระหว่าง Redis กับ Browser

import { subscribeMealEvents } from "@/lib/realtime/subscriber";

export async function GET() {

    // SSE ต้องส่งข้อมูลเป็น bytes ให้ ReadableStream 
    const encoder = new TextEncoder();

    let unsubscribe: (() => void) | undefined;

    // สร้าง Stream
    // สร้างช่องทางที่สามารถ ส่งข้อมูลไป Browser ทีละชุดในภายหลัง ได้
    const stream = new ReadableStream({
        // start คือฟังก์ชันที่ทำงานตอน Stream เริ่มทำงาน
        async start(controller) {

            // subscribeMealEvents คือฟังก์ชันที่รับ callback function
            unsubscribe = await subscribeMealEvents((event) => {

                // SSE ใช้ data: เพื่อบอกว่าเป็น event data
                const data = `data: ${JSON.stringify(event)}\n\n`;

                // ส่ง Event เข้า Stream
                controller.enqueue(encoder.encode(data));
            });
        },

        cancel() {
            unsubscribe?.();
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