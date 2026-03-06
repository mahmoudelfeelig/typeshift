import { z } from "zod";

export const MODE_VALUES = [
  "time",
  "quote",
  "meteor",
  "zen",
  "pulse",
  "relay",
  "cipher",
  "drift",
  "reverse",
  "echo",
  "rogue",
  "duel",
  "code",
  "coach",
  "blackout",
  "chain",
  "gravity",
  "coop",
  "infection",
  "stealth",
  "chart",
] as const;

export const modeSchema = z.enum(MODE_VALUES);
export type Mode = z.infer<typeof modeSchema>;

export interface ScorePayload {
  sessionId: string;
  mode: Mode;
  username: string;
  wpm: number;
  raw: number;
  accuracy: number;
  errors: number;
  streak: number;
  durationMs: number;
  clientVersion?: string;
  telemetry?: {
    typedChars: number;
    correctChars: number;
    wrongChars: number;
    avgKeyIntervalMs: number;
    burstKps: number;
    idleRatio: number;
    timelineHash?: string;
  };
}
