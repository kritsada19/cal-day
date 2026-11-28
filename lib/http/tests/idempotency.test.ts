import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withIdempotency } from "../idempotency";

const { mockRedis } = vi.hoisted(() => ({
  mockRedis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock("@/lib/db/redis", () => ({
  redis: mockRedis,
}));

function makeReq(key?: string) {
  return new NextRequest("http://localhost/api/meals", {
    method: "POST",
    headers: key ? { "idempotency-key": key } : undefined,
  });
}

describe("withIdempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs handler directly when Idempotency-Key header is missing", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }, { status: 201 }));

    const res = await withIdempotency(makeReq(), "meals:create", 7, handler);

    expect(res.status).toBe(201);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it("acquires lock, runs handler, and caches 2xx response in Redis", async () => {
    mockRedis.set.mockResolvedValue("OK");
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ mealId: 12 }, { status: 201 }));

    const res = await withIdempotency(makeReq("key-1"), "meals:create", 7, handler);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ mealId: 12 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockRedis.set).toHaveBeenNthCalledWith(
      1,
      "idem:meals:create:7:key-1",
      JSON.stringify({ status: "processing" }),
      "EX",
      60,
      "NX",
    );
    expect(mockRedis.set).toHaveBeenNthCalledWith(
      2,
      "idem:meals:create:7:key-1",
      JSON.stringify({ status: "done", httpStatus: 201, body: { mealId: 12 } }),
      "EX",
      60 * 60 * 24,
    );
  });

  it("returns cached response without calling handler when already done", async () => {
    mockRedis.set.mockResolvedValue(null);
    mockRedis.get.mockResolvedValue(
      JSON.stringify({ status: "done", httpStatus: 201, body: { mealId: 12 } }),
    );
    const handler = vi.fn();

    const res = await withIdempotency(makeReq("key-1"), "meals:create", 7, handler);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ mealId: 12 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 409 when another request with same key is still processing", async () => {
    mockRedis.set.mockResolvedValue(null);
    mockRedis.get.mockResolvedValue(JSON.stringify({ status: "processing" }));
    const handler = vi.fn();

    const res = await withIdempotency(makeReq("key-1"), "meals:create", 7, handler);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ message: "Request already in progress" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("deletes lock on 5xx response so client can retry", async () => {
    mockRedis.set.mockResolvedValue("OK");
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ error: "fail" }, { status: 503 }));

    const res = await withIdempotency(makeReq("key-1"), "meals:create", 7, handler);

    expect(res.status).toBe(503);
    expect(mockRedis.del).toHaveBeenCalledWith("idem:meals:create:7:key-1");
  });

  it("deletes lock and rethrows when handler throws", async () => {
    mockRedis.set.mockResolvedValue("OK");
    const handler = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(
      withIdempotency(makeReq("key-1"), "meals:create", 7, handler),
    ).rejects.toThrow("boom");

    expect(mockRedis.del).toHaveBeenCalledWith("idem:meals:create:7:key-1");
  });
});

