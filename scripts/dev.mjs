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

const children = [];
let exiting = false;

function startProcess(_label, commandArgs) {
  const child = isWindows
    ? spawn("cmd.exe", ["/d", "/s", "/c", `${npmCommand} ${commandArgs.join(" ")}`], {
        stdio: "inherit",
        shell: false,
        env: process.env,
      })
    : spawn(npmCommand, commandArgs, {
        stdio: "inherit",
        shell: false,
        env: process.env,
      });

  child.on("error", (error) => {
    if (!exiting) {
      exiting = true;
      console.error("Failed to spawn child process:", error);
      process.exit(1);
    }
  });

  child.on("exit", (code, signal) => {
    if (!exiting) {
      exiting = true;
      for (const proc of children) {
        if (!proc.killed) {
          proc.kill(isWindows ? undefined : "SIGTERM");
        }
      }
      if (signal && !isWindows) {
        process.kill(process.pid, signal);
      } else {
        process.exit(code ?? 1);
      }
    }
  });

  children.push(child);
  return child;
}

startProcess("server", ["run", "dev", "-w", "server"]);
startProcess("client", ["run", "dev", "-w", "client", "--", "--hostname", host, "--port", port]);

function shutdown() {
  if (exiting) {
    return;
  }
  exiting = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(isWindows ? undefined : "SIGTERM");
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
