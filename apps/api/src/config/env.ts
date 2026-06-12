import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().replace(/^\uFEFF/, "");
    const value = line.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env"));
loadEnvFile(path.resolve(process.cwd(), "../../.env"));

const booleanFromString = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    return value === "true";
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  TOKEN_HASH_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
  MAGIC_LINK_DEV_MODE: booleanFromString.default(false),
  RETENTION_SWEEP_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(26_214_400),
  MODERATION_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  MODERATION_WEBHOOK_TOKEN: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: booleanFromString.default(false),
  S3_PUBLIC_BASE_URL: z.string().url().optional().or(z.literal(""))
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
