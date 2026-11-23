import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger"

// Reuse Prisma Client instance to prevent unnecessary reconnection
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const basePrisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter: new PrismaPg(
            new Pool({
                connectionString: env.DATABASE_URL,
            })
        ),
    });

const prisma = basePrisma.$extends({
    query: {
        // ดักจับการทำงานทุก models
        $allModels: {
            // ดักจับทุก operations
            async $allOperations({ model, operation, args, query }) {
                const start = performance.now();

                try {
                    return await query(args);
                } finally {
                    const duration = performance.now() - start;

                    logger.info(
                        {
                            model,
                            operation,
                            duration: Number(duration.toFixed(2)),
                        },
                        "Database Query Performance"
                    )
                }
            }
        }
    }
})

export default prisma;

// import { PrismaClient } from "@/app/generated/prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { Pool } from 'pg';

// const pool = new Pool({ connectionString: env.DATABASE_URL });
// const adapter = new PrismaPg(pool);

// const prisma = new PrismaClient({ adapter })

// export default prisma