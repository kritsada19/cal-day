import { vi } from "vitest";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

vi.mock('@/lib/db/redis', () => ({
    redis: {
        incr: vi.fn().mockResolvedValue(1),
        decr: vi.fn().mockResolvedValue(0),
        expire: vi.fn().mockResolvedValue(1),
        del: vi.fn().mockResolvedValue(1),
        get: vi.fn().mockResolvedValue(0),
        set: vi.fn().mockResolvedValue('OK'),
    },
}));


