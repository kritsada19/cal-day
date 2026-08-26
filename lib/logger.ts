import pino from "pino";

/**
 * Application logger for both server and browser code.
 *
 * Pino automatically uses its browser implementation when bundled for client
 * components, while server logs are emitted as JSON for log aggregation.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: [
    "password",
    "passwordHash",
    "authorization",
    "headers.authorization",
    "cookie",
    "headers.cookie",
  ],
});
