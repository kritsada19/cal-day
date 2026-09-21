// คนฟัง Event

import { redis } from "@/lib/db/redis";

const subscriber = redis.duplicate();

// subscribeMealEvents รับ ฟังก์ชันหนึ่งตัว เข้ามา และฟังก์ชันนั้นต้องรับ event เป็น parameter
export async function subscribeMealEvents(
    // ฟังก์ชันที่ถูกส่งเข้ามา จะถูกเรียกว่า callback
    callback: (event: {
        type: string;
        userId: string;
    }) => void
) {
    await subscriber.subscribe("meal-events");

    const listener = (channel: string, message: string) => {
        if (channel !== "meal-events") return;

        const event = JSON.parse(message);

        callback(event);
    };

    // รอรับ Event
    subscriber.on("message", listener);

    // คืน function สำหรับถอด listener
    return () => {
        subscriber.off("message", listener);
    };
}