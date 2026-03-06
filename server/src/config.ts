import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@127.0.0.1:5432/typeshift"),
  DATABASE_SSL: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  JWT_SESSION_SECRET: z
    .string()
    .min(32)
    .default("dev-only-secret-change-this-before-production-123456"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).optional(),
  ALLOW_IN_MEMORY_FALLBACK: z
    .string()
    .optional()
    .transform((value) => (value == null ? undefined : value === "true")),
  REQUIRE_DATABASE_IN_PROD: z
    .string()
    .optional()
    .transform((value) => (value == null ? undefined : value !== "false")),
  METRICS_ENABLED: z
    .string()
    .optional()
    .transform((value) => (value == null ? undefined : value !== "false")),
  ENFORCE_HTTPS: z
    .string()
    .optional()
    .transform((value) => (value == null ? undefined : value !== "false")),
  STRICT_MUTATION_ORIGIN: z
    .string()
    .optional()
    .transform((value) => (value == null ? undefined : value !== "false")),
  MAX_JSON_BODY: z
    .string()
    .default("16kb")
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().regex(/^\d+(b|kb|mb)$/)),
  METRICS_TOKEN: z
    .string()
    .optional()
    .transform((value) => {
      if (value == null) return undefined;
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    })
    .pipe(z.string().min(8).optional()),
  SCORE_RETENTION_DAYS: z.coerce.number().int().min(7).max(3650).default(365),
  TELEMETRY_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(30),
});

const parsed = envSchema.parse(process.env);

const corsOrigins = parsed.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowInMemoryFallback =
  parsed.ALLOW_IN_MEMORY_FALLBACK ?? (parsed.NODE_ENV === "production" ? false : true);

const requireDatabaseInProd = parsed.REQUIRE_DATABASE_IN_PROD ?? true;
const metricsEnabled = parsed.METRICS_ENABLED ?? true;
const trustProxyHops = parsed.TRUST_PROXY_HOPS ?? (parsed.NODE_ENV === "production" ? 1 : 0);
const enforceHttps = parsed.ENFORCE_HTTPS ?? (parsed.NODE_ENV === "production");
const strictMutationOrigin = parsed.STRICT_MUTATION_ORIGIN ?? true;

export const config = {
  ...parsed,
  METRICS_ENABLED: metricsEnabled,
  corsOrigins,
  allowInMemoryFallback,
  requireDatabaseInProd,
  trustProxyHops,
  enforceHttps,
  strictMutationOrigin,
};

if (config.NODE_ENV === "production" && config.JWT_SESSION_SECRET.startsWith("dev-only-secret")) {
  throw new Error("JWT_SESSION_SECRET must be replaced in production");
}

if (config.NODE_ENV === "production" && !config.allowInMemoryFallback && !config.requireDatabaseInProd) {
  throw new Error("Invalid production config: disable ALLOW_IN_MEMORY_FALLBACK or enable REQUIRE_DATABASE_IN_PROD");
}
