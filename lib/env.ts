import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
    server: {
        DATABASE_URL: z.string(),
        REDIS_URL: z.string(),
        NEXTAUTH_SECRET: z.string().min(32),
        NEXTAUTH_URL: z.string().url(),

        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),

        STRIPE_SECRET_KEY: z.string().min(1),
        STRIPE_WEBHOOK_SECRET: z.string().min(1),
        STRIPE_PRO_PRICE_ID: z.string().min(1),

        GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.string().url(),
    },
    runtimeEnv: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
        GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    }
})