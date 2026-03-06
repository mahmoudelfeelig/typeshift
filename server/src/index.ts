import pino from "pino";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { migrateDatabase } from "./db/migrate.js";
import { pool } from "./db/pool.js";
import { setDatabaseOnline } from "./db/state.js";
import { startRetentionWorker, stopRetentionWorker } from "./db/retention.js";

const logger = pino({ level: config.LOG_LEVEL });

async function start() {
  let initialDbOnline = false;
  try {
    await migrateDatabase();
    initialDbOnline = true;
    logger.info("Database migration successful");
  } catch (error) {
    const mustFail =
      (config.NODE_ENV === "production" && config.requireDatabaseInProd) || !config.allowInMemoryFallback;
    if (mustFail) {
      logger.error({ err: error }, "Database migration failed and fallback is not allowed");
      throw error;
    }
    logger.warn({ err: error }, "Database unavailable. Starting API in in-memory fallback mode");
  }
  setDatabaseOnline(initialDbOnline);
  // Always run the worker so fallback mode can recover automatically when Postgres is back.
  startRetentionWorker(logger);

  const app = createApp(logger);
  const server = app.listen(config.PORT, () => {
    logger.info(
      { port: config.PORT, mode: initialDbOnline ? "postgres" : "in-memory" },
      "TypeShift API online",
    );
  });

  const shutdown = async () => {
    logger.info("Shutting down API");
    stopRetentionWorker();
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  logger.error({ err: error }, "Failed to start API");
  process.exit(1);
});
