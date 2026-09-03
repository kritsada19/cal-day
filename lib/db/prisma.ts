import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/lib/env";

// Reuse Prisma Client instance to prevent unnecessary reconnection
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter: new PrismaPg(
            new Pool({
                connectionString: env.DATABASE_URL,
            })
        ),
    });

export default prisma;

// import { PrismaClient } from "@/app/generated/prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { Pool } from 'pg';

// const pool = new Pool({ connectionString: env.DATABASE_URL });
// const adapter = new PrismaPg(pool);

// const prisma = new PrismaClient({ adapter })

// export default prisma