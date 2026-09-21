// คนส่ง Event

import { redis } from "@/lib/db/redis";

export async function publishMealEvent(event: {
    type: string;
    userId: string;
}) {
    await redis.publish(
        "meal-events",
        JSON.stringify(event)
    );
}