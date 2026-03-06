import { Router, type Request } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { isDatabaseOnline } from "../db/state.js";
import { getMemoryAnalyticsSummary, incrementMemoryAnalyticsAggregate } from "../db/inMemory.js";
import { config } from "../config.js";
import { modeSchema } from "../types.js";
import { extractBearerToken, safeTokenCompare } from "../lib/security.js";

const router = Router();

const analyticsEventSchema = z.object({
  event: z.enum([
    "page_view",
    "mode_select",
    "run_start",
    "run_finish",
    "auth_register",
    "auth_login",
    "consent_update",
  ]),
  page: z.string().trim().min(1).max(32).optional(),
  mode: modeSchema.optional(),
  theme: z.enum(["dark", "light"]).optional(),
  consentVersion: z.number().int().min(1).max(20).optional(),
  telemetry: z
    .object({
      viewportBucket: z.enum(["sm", "md", "lg", "xl"]).optional(),
      reducedMotion: z.boolean().optional(),
      doNotTrack: z.boolean().optional(),
    })
    .optional(),
});

const analyticsSummaryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
});

function authorizeAnalyticsSummary(req: Request): boolean {
  if (config.NODE_ENV !== "production" && !config.METRICS_TOKEN) {
    return true;
  }
  if (!config.METRICS_TOKEN) {
    return false;
  }
  const headerToken = req.get("x-metrics-token");
  const bearerToken = extractBearerToken(req.get("authorization"));
  const token = headerToken ?? bearerToken ?? "";
  return safeTokenCompare(config.METRICS_TOKEN, token);
}

router.post("/privacy/analytics", async (req, res, next) => {
  try {
    const parsed = analyticsEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid analytics payload" });
    }
    if (parsed.data.telemetry?.doNotTrack) {
      return res.status(202).json({ ok: true, skipped: true });
    }

    const dateKey = new Date().toISOString().slice(0, 10);
    const page = parsed.data.page ?? null;
    const mode = parsed.data.mode ?? null;
    const theme = parsed.data.theme ?? null;
    const viewportBucket = parsed.data.telemetry?.viewportBucket ?? null;
    const reducedMotion = parsed.data.telemetry?.reducedMotion ?? null;
    const consentVersion = parsed.data.consentVersion ?? null;
    const dimensionKey = [
      dateKey,
      parsed.data.event,
      page ?? "",
      mode ?? "",
      theme ?? "",
      viewportBucket ?? "",
      reducedMotion == null ? "" : String(reducedMotion),
      consentVersion == null ? "" : String(consentVersion),
    ].join("|");

    if (!isDatabaseOnline()) {
      incrementMemoryAnalyticsAggregate({
        dateKey,
        eventName: parsed.data.event,
        page,
        mode,
        theme,
        viewportBucket,
        reducedMotion,
        consentVersion,
      });
      return res.status(202).json({ ok: true });
    }

    await pool.query(
      `INSERT INTO analytics_daily_aggregates (
         dimension_key, date_key, event_name, page, mode, theme, viewport_bucket, reduced_motion, consent_version, count, last_seen_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, NOW())
       ON CONFLICT (dimension_key)
       DO UPDATE SET count = analytics_daily_aggregates.count + 1, last_seen_at = NOW()`,
      [dimensionKey, dateKey, parsed.data.event, page, mode, theme, viewportBucket, reducedMotion, consentVersion],
    );

    return res.status(202).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get("/privacy/analytics/summary", async (req, res, next) => {
  try {
    if (!authorizeAnalyticsSummary(req)) {
      return res.status(401).json({ error: "Unauthorized analytics summary access" });
    }
    const parsed = analyticsSummaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid analytics summary query" });
    }
    const days = parsed.data.days;

    if (!isDatabaseOnline()) {
      const rows = getMemoryAnalyticsSummary(days);
      const totals = rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.eventName] = (acc[row.eventName] ?? 0) + row.count;
        return acc;
      }, {});
      return res.json({ days, totals, rows: rows.slice(0, 160) });
    }

    const result = await pool.query(
      `SELECT date_key, event_name, page, mode, theme, viewport_bucket, reduced_motion, consent_version, count
         FROM analytics_daily_aggregates
        WHERE date_key >= CURRENT_DATE - ($1::int - 1)
        ORDER BY date_key DESC, count DESC, event_name ASC
        LIMIT 160`,
      [days],
    );
    const rows = result.rows.map((row) => ({
      dateKey: String(row.date_key).slice(0, 10),
      eventName: row.event_name as string,
      page: (row.page as string | null) ?? null,
      mode: (row.mode as z.infer<typeof modeSchema> | null) ?? null,
      theme: (row.theme as "dark" | "light" | null) ?? null,
      viewportBucket: (row.viewport_bucket as "sm" | "md" | "lg" | "xl" | null) ?? null,
      reducedMotion: (row.reduced_motion as boolean | null) ?? null,
      consentVersion: (row.consent_version as number | null) ?? null,
      count: Number(row.count),
    }));
    const totals = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.eventName] = (acc[row.eventName] ?? 0) + row.count;
      return acc;
    }, {});
    return res.json({ days, totals, rows });
  } catch (error) {
    return next(error);
  }
});

export { router as privacyRouter };
