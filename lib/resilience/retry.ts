export function isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const msg = error.message;
    return (
        msg.includes("429") ||
        msg.includes("500") ||
        msg.includes("502") ||
        msg.includes("503") ||
        msg.includes("504") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT")
    );
}

type RetryOptions = {
    maxRetries?: number;
    baseDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 2,
        baseDelayMs = 500,
        shouldRetry = isRetryableError,
    } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isLastAttempt = attempt === maxRetries;
            if (isLastAttempt || !shouldRetry(error)) {
                throw error;
            }

            const backoff = baseDelayMs * 2 ** attempt;

            // บวกเวลาเพิ่มแบบสุ่มเพื่อป้องกัน retry พร้อมกัน
            const jitter = Math.random() * 200;

            await sleep(backoff + jitter);
        }
    }

    throw lastError;
}