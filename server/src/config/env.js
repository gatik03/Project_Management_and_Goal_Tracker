import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  JWT_COOKIE_NAME: z.string().default("goal_portal_token"),
  JWT_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().url().optional(),
  CLIENT_ORIGINS: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);

const rawAllowedOrigins = [env.CLIENT_ORIGINS, env.CLIENT_ORIGIN]
  .filter(Boolean)
  .join(",")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (env.NODE_ENV === "production" && rawAllowedOrigins.length === 0) {
  throw new Error("CLIENT_ORIGIN or CLIENT_ORIGINS must be set in production");
}

export const allowedOrigins = rawAllowedOrigins;
