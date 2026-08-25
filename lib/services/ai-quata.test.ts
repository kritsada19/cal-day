/** @vitest-environment node */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { getUserAiQuota, checkAndComsumeAiQuota } from "./ai-quota";
import { redis } from "../db/redis";

describe("getUserAiQuota", () => {
  it("return remaining 5 for paln free", async () => {
    const result = await getUserAiQuota(1, "FREE");

    expect(result.usage).toBe(0);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(5);
  });
  it("return remaining 50 for paln pro", async () => {
    const result = await getUserAiQuota(1, "PRO");

    expect(result.usage).toBe(0);
    expect(result.limit).toBe(50);
    expect(result.remaining).toBe(50);
  });
});

describe("checkAndComsumeAiQuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses FREE plan by default and sets expiry on first call", async () => {
    const redisMock = vi.mocked(redis);
    redisMock.incr.mockResolvedValue(1);
    redisMock.get.mockResolvedValue("1");

    const res = await checkAndComsumeAiQuota(10, "FREE");

    expect(res).toBeUndefined();
    expect(redisMock.incr).toHaveBeenCalledWith("ai_limit:10");
    expect(redisMock.expire).toHaveBeenCalledWith("ai_limit:10", 60 * 60 * 24);

    const q = await getUserAiQuota(10, "FREE");
    expect(q.usage).toBe(1);
    expect(q.limit).toBe(5);
    expect(q.remaining).toBe(4);
  });

  it("increments usage and sets expiry on first call", async () => {
    const redisMock = vi.mocked(redis);
    redisMock.incr.mockResolvedValue(1);
    redisMock.get.mockResolvedValue("1");

    const res = await checkAndComsumeAiQuota(10, "FREE");
    expect(res).toBeUndefined();

    const q = await getUserAiQuota(10, "FREE");
    expect(q.usage).toBe(1);
    expect(q.remaining).toBe(4);
  });

  it("returns 429 when FREE plan exceeds quota", async () => {
    const redisMock = vi.mocked(redis);
    redisMock.incr.mockResolvedValue(6);
    redisMock.get.mockResolvedValue("6");

    const res = await checkAndComsumeAiQuota(11, "FREE");

    expect(res).toBeInstanceOf(Response);
    expect(res?.status).toBe(429);
    const body = await res?.json();
    expect(body).toEqual({ message: "AI limit reached. Please upgrade to premium to continue." });
  });

  it("returns 429 when PRO plan exceeds quota", async () => {
    const redisMock = vi.mocked(redis);
    redisMock.incr.mockResolvedValue(51);
    redisMock.get.mockResolvedValue("51");

    const res = await checkAndComsumeAiQuota(12, "PRO");

    expect(res).toBeInstanceOf(Response);
    expect(res?.status).toBe(429);
    const body = await res?.json();
    expect(body).toEqual({ message: "Pro AI limit reached. Please contact support for assistance." });
  });
});
