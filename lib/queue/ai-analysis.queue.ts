import { Queue } from "bullmq";
import { redis } from "@/lib/queue/connection";

export const aiAnalysisQueue = new Queue("ai-analysis", {
    connection: redis,
});