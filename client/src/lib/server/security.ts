import { Buffer } from "node:buffer";
import type { Mode } from "./types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9 _.-]{0,22}[A-Za-z0-9])?$/;
const PASSWORD_HASH_ITERATIONS = 100_000;

interface TokenClaimsBase {
  aud: "session" | "account";
  exp: number;
  iat: number;
  sid: string;
}

export interface SessionTokenClaims extends TokenClaimsBase {
  aud: "session";
  mode: Mode;
}

export interface AccountTokenClaims extends TokenClaimsBase {
  aud: "account";
  aid: string;
  handle: string;
}

function toBase64Url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? encoder.encode(input) : input;
  return Buffer.from(bytes).toString("base64url");
}

function fromBase64Url(input: string): Uint8Array {
  return Uint8Array.from(Buffer.from(input, "base64url"));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signHmac(secret: string, message: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(signature));
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function parsePayload<T>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  try {
    const payload = JSON.parse(decoder.decode(fromBase64Url(parts[1] ?? ""))) as T;
    return payload;
  } catch (_error) {
    return null;
  }
}

export async function signSessionToken(sessionId: string, mode: Mode, secret: string): Promise<string> {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = toBase64Url(
    JSON.stringify({
      aud: "session",
      exp: issuedAt + 15 * 60,
      iat: issuedAt,
      sid: sessionId,
      mode,
    } satisfies SessionTokenClaims),
  );
  const signature = await signHmac(secret, `${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export async function signAccountToken(
  sessionId: string,
  accountId: string,
  handle: string,
  secret: string,
): Promise<string> {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = toBase64Url(
    JSON.stringify({
      aud: "account",
      exp: issuedAt + 60 * 60 * 24 * 30,
      iat: issuedAt,
      sid: sessionId,
      aid: accountId,
      handle,
    } satisfies AccountTokenClaims),
  );
  const signature = await signHmac(secret, `${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionTokenClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const payload = parsePayload<SessionTokenClaims>(token);
  if (!payload || payload.aud !== "session" || !payload.sid || !payload.mode) {
    return null;
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }
  const signed = `${parts[0]}.${parts[1]}`;
  const signature = await signHmac(secret, signed);
  if (!safeEqual(signature, parts[2] ?? "")) {
    return null;
  }
  return payload;
}

export async function verifyAccountToken(
  token: string,
  secret: string,
): Promise<AccountTokenClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const payload = parsePayload<AccountTokenClaims>(token);
  if (!payload || payload.aud !== "account" || !payload.sid || !payload.aid || !payload.handle) {
    return null;
  }
  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }
  const signed = `${parts[0]}.${parts[1]}`;
  const signature = await signHmac(secret, signed);
  if (!safeEqual(signature, parts[2] ?? "")) {
    return null;
  }
  return payload;
}

export async function hashClientValue(input: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importHmacKey(secret),
    encoder.encode(input),
  );
  return Buffer.from(signature).toString("hex");
}

export function extractBearerToken(header?: string | null): string | null {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.trim().split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomId(): string {
  return crypto.randomUUID();
}

export function randomPublicId(length = 12): string {
  return toBase64Url(randomBytes(length)).slice(0, Math.max(8, length + 4));
}

export function passwordMeetsPolicy(password: string): boolean {
  return password.length >= 10 && password.length <= 128 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export async function createPasswordHash(password: string): Promise<{ salt: string; hash: string }> {
  const saltBytes = randomBytes(16);
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PASSWORD_HASH_ITERATIONS,
      salt: saltBytes as BufferSource,
    },
    key,
    256,
  );
  return {
    salt: bytesToHex(saltBytes),
    hash: bytesToHex(new Uint8Array(bits)),
  };
}

export async function verifyPasswordHash(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PASSWORD_HASH_ITERATIONS,
      salt: hexToBytes(salt) as BufferSource,
    },
    key,
    256,
  );
  return safeEqual(bytesToHex(new Uint8Array(bits)), expectedHash);
}

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^A-Za-z0-9 _.-]/g, "");
}

export function usernameMeetsPolicy(raw: string): boolean {
  const collapsed = raw.trim().replace(/\s+/g, " ");
  const normalized = normalizeUsername(raw);
  return normalized === collapsed && normalized.length >= 2 && normalized.length <= 24 && USERNAME_PATTERN.test(normalized);
}

export function describeSessionLabel(userAgent?: string | null): string {
  const source = (userAgent ?? "").toLowerCase();
  const browser = source.includes("edg/")
    ? "Edge"
    : source.includes("firefox/")
      ? "Firefox"
      : source.includes("chrome/")
        ? "Chrome"
        : source.includes("safari/")
          ? "Safari"
          : "Browser";
  const os = source.includes("windows")
    ? "Windows"
    : source.includes("android")
      ? "Android"
      : source.includes("iphone") || source.includes("ipad") || source.includes("ios")
        ? "iOS"
        : source.includes("mac os") || source.includes("macintosh")
          ? "macOS"
          : source.includes("linux")
            ? "Linux"
            : "Unknown OS";
  return `${browser} on ${os}`;
}

export function isReasonableScore(payload: {
  wpm: number;
  raw: number;
  accuracy: number;
  durationMs: number;
  errors: number;
  telemetry?: {
    typedChars: number;
    correctChars: number;
    wrongChars: number;
    avgKeyIntervalMs: number;
    burstKps: number;
    idleRatio: number;
    timelineHash?: string;
  };
}): boolean {
  if (payload.raw < payload.wpm) {
    return false;
  }
  if (payload.wpm > 320 || payload.raw > 380) {
    return false;
  }
  if (payload.durationMs < 12_000 && payload.wpm > 170) {
    return false;
  }
  if (payload.durationMs < 7_000 || payload.errors > 2_500) {
    return false;
  }
  if (payload.accuracy < 45 && payload.wpm > 130) {
    return false;
  }
  if (payload.telemetry) {
    const telemetry = payload.telemetry;
    if (telemetry.typedChars + 400 < telemetry.correctChars) {
      return false;
    }
    if (telemetry.avgKeyIntervalMs < 8 || telemetry.avgKeyIntervalMs > 1_000) {
      return false;
    }
    if (telemetry.burstKps > 35 || telemetry.idleRatio > 0.98 || telemetry.idleRatio < 0) {
      return false;
    }
    if (telemetry.timelineHash && !/^[a-f0-9]{64}$/i.test(telemetry.timelineHash)) {
      return false;
    }
  }
  return true;
}
