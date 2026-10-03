// คนฟัง Event

import { redis } from "@/lib/db/redis";

// subscribeEvents รับ ฟังก์ชันหนึ่งตัว เข้ามา และฟังก์ชันนั้นต้องรับ event เป็น parameter
export async function subscribeEvents(
    // ฟังก์ชันที่ถูกส่งเข้ามา จะถูกเรียกว่า callback
    callback: (event: {
        type: string;
        userId: string;
        jobId?: string;
    }) => void
) {
    // ✅ แยก Redis connection ต่อ 1 SSE client
    // แทนที่จะใช้ singleton ร่วมกัน ทำให้ subscribe/unsubscribe เป็นอิสระจากกัน
    // และ listener ของแต่ละ user ไม่ต้องวิ่งผ่านกัน
    const sub = redis.duplicate();

    await sub.subscribe(
        "meal-events",
        "profile-events"
    );

    const listener = (channel: string, message: string) => {
        if (channel !== "meal-events" && channel !== "profile-events") return;

        const event = JSON.parse(message);

        callback(event);
    };

    // รอรับ Event
    sub.on("message", listener);

    // คืน function สำหรับ cleanup ทั้งหมด
    return async () => {
        sub.off("message", listener);
        // ✅ unsubscribe channel และ disconnect Redis ให้สะอาด
        await sub.unsubscribe();
        sub.disconnect();
    };
}