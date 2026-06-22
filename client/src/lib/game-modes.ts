import type { Mode } from "./api";

export interface ModeMeta {
  label: string;
  flavor: string;
  timed: boolean;
  slug: string;
}

export const MODE_META: Record<Mode, ModeMeta> = {
  time: {
    label: "Sprint",
    flavor: "Timed word run.",
    timed: true,
    slug: "sprint",
  },
  quote: {
    label: "Quote",
    flavor: "Finish one full line.",
    timed: false,
    slug: "quote",
  },
  meteor: {
    label: "Meteor",
    flavor: "Help the elephant clear falling words.",
    timed: true,
    slug: "meteor",
  },
  zen: {
    label: "Flow",
    flavor: "No timer, endless words.",
    timed: false,
    slug: "flow",
  },
  pulse: {
    label: "Pulse",
    flavor: "Beat-timed scoring lane.",
    timed: true,
    slug: "pulse",
  },
  relay: {
    label: "Relay",
    flavor: "Mistakes push you backward.",
    timed: true,
    slug: "relay",
  },
  cipher: {
    label: "Cipher",
    flavor: "Global shift decode mode.",
    timed: true,
    slug: "cipher",
  },
  drift: {
    label: "Drift",
    flavor: "Words drift side-to-side while you type.",
    timed: true,
    slug: "drift",
  },
  reverse: {
    label: "Reverse",
    flavor: "Reading order flips right-to-left.",
    timed: true,
    slug: "reverse",
  },
  echo: {
    label: "Echo",
    flavor: "Type the previous word from memory.",
    timed: true,
    slug: "echo",
  },
  rogue: {
    label: "Rogue",
    flavor: "Pick run perks every few clears.",
    timed: true,
    slug: "rogue",
  },
  duel: {
    label: "Rhythm Duel",
    flavor: "Beat-timed run vs rival pace.",
    timed: true,
    slug: "rhythm-duel",
  },
  code: {
    label: "Code",
    flavor: "Type syntax-heavy programming words.",
    timed: true,
    slug: "code",
  },
  coach: {
    label: "Coach",
    flavor: "Adaptive drills from your weak patterns.",
    timed: true,
    slug: "coach",
  },
  blackout: {
    label: "Blackout",
    flavor: "Typed letters fade; trust muscle memory.",
    timed: true,
    slug: "blackout",
  },
  chain: {
    label: "Chain",
    flavor: "Combo multipliers on long clean streaks.",
    timed: true,
    slug: "chain",
  },
  gravity: {
    label: "Gravity Flip",
    flavor: "Flow direction flips with time pulses.",
    timed: true,
    slug: "gravity-flip",
  },
  coop: {
    label: "Co-op Relay",
    flavor: "Two pilots alternate each cleared word.",
    timed: true,
    slug: "co-op-relay",
  },
  infection: {
    label: "Infection",
    flavor: "Mistakes infect nearby words until cleaned.",
    timed: true,
    slug: "infection",
  },
  stealth: {
    label: "Stealth",
    flavor: "Only first and last letters stay visible.",
    timed: true,
    slug: "stealth",
  },
  chart: {
    label: "Rhythm Chart",
    flavor: "Strict beatmap windows for each submit.",
    timed: true,
    slug: "rhythm-chart",
  },
};

export const MODE_DETAILS: Record<Mode, string> = {
  time: "A straight speed run. Clean rhythm and sustained focus matter more than gimmicks here.",
  quote: "One complete passage with no timer pressure. Useful for endurance and punctuation control.",
  meteor: "Guide the station elephant through a word shower. The first letter locks the nearest matching target.",
  zen: "Endless practice with no clock. Good for warming up or drilling accuracy without pressure.",
  pulse: "Every submit is judged against the beat. Better timing means cleaner bonus scoring.",
  relay: "Mistakes kick you backward through the prompt. Strong for recovery discipline under pressure.",
  cipher: "All words are shifted by the same amount. Decode fast and keep your pattern recognition sharp.",
  drift: "Words slide while you read them. Tracks eye control and quick target reacquisition.",
  reverse: "The reading direction flips. Good for breaking autopilot and forcing deliberate reads.",
  echo: "Clear a word, then repeat the last one from memory. Strong for recall and sequencing.",
  rogue: "Perks change the run every few clears. Higher variance, more aggressive pacing.",
  duel: "A rhythm-forward race against rival pace. Keep the beat or lose ground.",
  code: "Programming-heavy words and snippets. Good for syntax accuracy and symbol handling.",
  coach: "Weights words toward patterns you miss. Best mode for targeted improvement.",
  blackout: "Letters fade under your hands. Forces trust in muscle memory.",
  chain: "Long clean streaks stack combo value. Rewards consistency.",
  gravity: "The lane flow flips on a timer. Strong for reset speed and attention shifting.",
  coop: "Alternating turns create a relay cadence. Good for handoff rhythm and recovery.",
  infection: "Mistakes spread pressure into nearby words. Clean up quickly or the lane gets messy.",
  stealth: "Middle letters vanish. Focus on shape, memory, and word skeletons.",
  chart: "The strictest rhythm mode. Smaller hit windows, stronger precision demand.",
};

export const GAME_MODES = Object.keys(MODE_META) as Mode[];

export function slugForMode(mode: Mode): string {
  return MODE_META[mode].slug;
}

export function modeFromSlug(slug: string): Mode | null {
  const normalized = slug.toLowerCase();
  return GAME_MODES.find((mode) => MODE_META[mode].slug === normalized || mode === normalized) ?? null;
}

export function pathForMode(mode: Mode): string {
  return `/games/${slugForMode(mode)}`;
}
