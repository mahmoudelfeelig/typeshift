#!/usr/bin/env node
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const isWindows = process.platform === "win32";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function getArg(name, fallback) {
  const index = args.findIndex((arg) => arg === `--${name}`);
  if (index === -1) {
    return fallback;
  }
  return args[index + 1] ?? fallback;
}

function sanitizeArg(value, fallback, pattern) {
  return pattern.test(value) ? value : fallback;
}

const host = sanitizeArg(getArg("host", "localhost"), "localhost", /^[A-Za-z0-9._:-]+$/);
const port = sanitizeArg(getArg("port", "5173"), "5173", /^\d{2,5}$/);

const child = isWindows
  ? spawn("cmd.exe", ["/d", "/s", "/c", `${npmCommand} run dev -w client -- --hostname ${host} --port ${port}`], {
      stdio: "inherit",
      shell: false,
      env: process.env,
    })
  : spawn(npmCommand, ["run", "dev", "-w", "client", "--", "--hostname", host, "--port", port], {
      stdio: "inherit",
      shell: false,
      env: process.env,
    });

child.on("error", (error) => {
  console.error("Failed to spawn client dev process:", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal && !isWindows) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
