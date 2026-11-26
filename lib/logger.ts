import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isServer = typeof window === "undefined";

/**
 * Application logger for both server and browser code.
 *
 * Pino automatically uses its browser implementation when bundled for client
 * components, while server logs are emitted as JSON for log aggregation.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),

  // เซ็นเซอร์ข้อมูลสำคัญใน Log
  redact: [
    "password",
    "passwordHash",
    "authorization",
    "headers.authorization",
    "cookie",
    "headers.cookie",
  ],

  // ระบบกำหนดว่า Log จะถูกส่งไปจัดการหรือแสดงผลอย่างไร
  ...(isDevelopment && isServer
    ? {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "",
          messageFormat: "{msg}",
          levelFirst: false,
        },
      },
    }
    : {}),
});
