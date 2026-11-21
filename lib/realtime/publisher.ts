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

export async function publishProfileUpdate(
    userId: string
) {
    await redis.publish(
        "profile-events",
        JSON.stringify({
            type: "profile.updated",
            userId: userId,
        })
    );
}

export async function publishFavoriteEvent(event: {
    type: "favorite.updated" | "favorite.deleted" | "favorite.created";
    userId: string;
    favoriteId?: number;
}) {
    await redis.publish(
        "favorite-events",
        JSON.stringify(event)
    );
}