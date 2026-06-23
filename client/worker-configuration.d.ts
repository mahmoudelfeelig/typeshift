interface D1Result {
  meta?: {
    changes?: number;
  };
}

interface D1PreparedStatement {
  bind(...values: Array<string | number | null>): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<D1Result>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface AnalyticsEngineDataset {
  writeDataPoint(point: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface R2Bucket {
  get(key: string): Promise<unknown>;
  put(key: string, value: ReadableStream | ArrayBuffer | string): Promise<unknown>;
  delete(key: string): Promise<void>;
}

interface CloudflareEnv {
  ASSETS?: Fetcher;
  DB?: D1Database;
  CACHE_KV?: KVNamespace;
  RATE_LIMIT_KV?: KVNamespace;
  NEXT_INC_CACHE_R2_BUCKET?: R2Bucket;
  REPLAY_BUCKET?: R2Bucket;
  BACKUP_BUCKET?: R2Bucket;
  USAGE_ANALYTICS?: AnalyticsEngineDataset;
  JWT_SESSION_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  METRICS_TOKEN?: string;
  BOT_SEED_TOKEN?: string;
  NEXTJS_ENV?: string;
  NEXT_PUBLIC_SITE_NAME?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_CONTROLLER_NAME?: string;
  NEXT_PUBLIC_CONTACT_EMAIL?: string;
  NEXT_PUBLIC_CONTACT_ADDRESS?: string;
  NEXT_PUBLIC_SUPPORT_EMAIL?: string;
  NEXT_PUBLIC_DPO_EMAIL?: string;
  NEXT_PUBLIC_LEGAL_LAST_UPDATED?: string;
  NEXT_PUBLIC_SCORE_RETENTION_DAYS?: string;
  NEXT_PUBLIC_TELEMETRY_RETENTION_DAYS?: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
  NEXT_PUBLIC_SOCIAL_LIVE_ENABLED?: string;
  NEXT_PUBLIC_CLOUDFLARE_ONLY?: string;
}
