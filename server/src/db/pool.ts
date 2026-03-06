import { Pool } from "pg";
import { config } from "../config.js";
import { setDatabaseOnline } from "./state.js";

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
  max: 20,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
  query_timeout: 8_000,
  statement_timeout: 8_000,
  idle_in_transaction_session_timeout: 8_000,
});

pool.on("error", (error) => {
  setDatabaseOnline(false);
  console.error("Unexpected Postgres pool error", error);
});
