import { NextRequest } from "next/server";
import { redis } from "@/lib/db/redis";

/**
 * Checks if the request should be rate-limited.
 * @param req The incoming NextRequest to extract the IP address.
 * @param action A string to identify the action (e.g., 'signup', 'login') for the Redis key.
 * @param limit The maximum number of requests allowed within the window.
 * @param windowSecs The time window in seconds.
 * @returns true if allowed, false if rate limited.
 */
export async function checkRateLimit(req: NextRequest, action: string, limit: number, windowSecs: number): Promise<boolean> {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const rateLimitKey = `ratelimit:${action}:${ip}`;

    // Increment the request count for this IP
    const currentReqs = await redis.incr(rateLimitKey);

    // Set expiry on the first request in the window
    if (currentReqs === 1) {
      await redis.expire(rateLimitKey, windowSecs);
    }

    // Check if limit exceeded
    if (currentReqs > limit) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If Redis fails, we might want to allow the request to pass or block it.
    // Usually it's better to fail open to not block real users if Redis is down.
    return true;
  }
}
