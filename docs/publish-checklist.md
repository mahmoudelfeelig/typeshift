# TypeShift Production Publish Checklist

## Edge and Transport Security

1. Put API behind TLS termination (Cloudflare, Nginx, ALB, or equivalent).
2. Enforce HTTPS redirect at the edge.
3. Enable WAF managed rules for bot mitigation and common API abuse patterns.
4. Restrict CORS origins in `CORS_ORIGINS` to production domains only.
5. Set `ENFORCE_HTTPS=true` and configure `TRUST_PROXY_HOPS` for your edge proxy chain.
6. Keep `STRICT_MUTATION_ORIGIN=true` unless you intentionally support cross-origin API writes.

## Runtime Configuration

1. `NODE_ENV=production`
2. `ALLOW_IN_MEMORY_FALLBACK=false`
3. `REQUIRE_DATABASE_IN_PROD=true`
4. Set strong `JWT_SESSION_SECRET` (32+ random chars).
5. Configure `DATABASE_URL` for managed Postgres.
6. Set `METRICS_TOKEN` if `/api/metrics` is exposed outside private networking.
7. Keep `MAX_JSON_BODY` low (default `16kb`) unless a specific endpoint requires larger payloads.

## Monitoring and Alerts

1. Scrape `/api/metrics`.
2. Alert on:
   - 5xx rate
   - p95 latency
   - failed challenge/leaderboard submissions
   - readiness failures
3. Retain structured logs from the API process (`pino`).

## Data Protection

1. Schedule backups:
   - `npm run backup:db`
2. Validate restore path regularly:
   - `npm run restore:db -- <backup-file>`
3. Keep retention policy enabled:
   - `SCORE_RETENTION_DAYS`
   - `TELEMETRY_RETENTION_DAYS`

## CI/CD Gate

1. CI must pass:
   - tests
   - build
2. Deploy only from reviewed branches.
3. Run post-deploy smoke checks:
   - `/api/health/live`
   - `/api/health/ready`
   - `/api/v1/challenge/daily`
