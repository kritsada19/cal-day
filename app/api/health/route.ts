import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { redis } from "@/lib/db/redis";

// Prisma's PostgreSQL adapter and ioredis require the Node.js runtime.
export const runtime = "nodejs";

// Health checks must always reflect the current state of each dependency.
export const dynamic = "force-dynamic";

const HEALTH_CHECK_TIMEOUT_MS = 3_000;

/**
 * Executes a dependency check with a time limit so an unavailable service
 * cannot leave the health endpoint waiting indefinitely.
 */
function checkConnection(check: () => Promise<unknown>): Promise<"up" | "down"> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve("down"), HEALTH_CHECK_TIMEOUT_MS);

    void check().then(
      () => {
        clearTimeout(timeout);
        resolve("up");
      },
      () => {
        clearTimeout(timeout);
        resolve("down");
      }
    );
  });
}

/**
 * Reports whether the application can reach its required data services.
 * A 503 response lets load balancers and monitoring services mark this
 * instance as unhealthy without exposing internal error details.
 */
export async function GET() {
  // Run both probes concurrently to keep the endpoint responsive.
  const [database, redisStatus] = await Promise.all([
    checkConnection(() => prisma.$queryRaw`SELECT 1`),
    checkConnection(() => redis.ping()),
  ]);

  const healthy = database === "up" && redisStatus === "up";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "unhealthy",
      database,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
