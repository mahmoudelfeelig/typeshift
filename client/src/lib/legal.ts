export interface LegalConfig {
  siteName: string;
  siteUrl: string;
  controllerName: string;
  contactEmail: string;
  contactAddress: string;
  supportEmail: string;
  dpoEmail: string | null;
  lastUpdated: string;
  scoreRetentionDays: number;
  telemetryRetentionDays: number;
}

export interface StorageEntry {
  key: string;
  purpose: string;
  required: "essential" | "optional";
  retention: string;
}

const defaultConfig: LegalConfig = {
  siteName: "TypeShift Station",
  siteUrl: "https://set-your-domain.example",
  controllerName: "Set your legal entity name",
  contactEmail: "privacy@example.com",
  contactAddress: "Set your registered business address",
  supportEmail: "support@example.com",
  dpoEmail: null,
  lastUpdated: "March 6, 2026",
  scoreRetentionDays: Number(process.env.NEXT_PUBLIC_SCORE_RETENTION_DAYS || 365),
  telemetryRetentionDays: Number(process.env.NEXT_PUBLIC_TELEMETRY_RETENTION_DAYS || 30),
};

export const storageEntries: StorageEntry[] = [
  {
    key: "typeshift.privacyConsent.v1",
    purpose: "Stores your privacy choices for cookies, comfort settings, and aggregate analytics.",
    required: "essential",
    retention: "Until you change or clear it.",
  },
  {
    key: "typeshift.accountToken.v1 / typeshift.accountProfile.v1 / typeshift.accountPrefs.v1",
    purpose: "Keeps your signed-in account session and synced profile/preferences on this device.",
    required: "essential",
    retention: "Until logout, account deletion, or browser storage clear.",
  },
  {
    key: "typeshift.customWords / typeshift.largeDictionary.v1 / typeshift.derivedDictionary.v1",
    purpose: "Caches dictionary content and custom word lists for faster typing sessions.",
    required: "essential",
    retention: "Up to 7 days for dictionary caches; custom words until removed.",
  },
  {
    key: "typeshift.score.queue.v1 / typeshift.leaderboard.cache.v1",
    purpose: "Queues offline score submissions and stores short-lived leaderboard cache for responsiveness.",
    required: "essential",
    retention: "Queued scores until delivery or failure; leaderboard cache up to 12 seconds.",
  },
  {
    key: "typeshift.bestByMode / typeshift.ghostRuns.v1 / typeshift.replays.v1 / typeshift.raceMeta.v1",
    purpose: "Stores local progress, ghost runs, replay files, and the last multiplayer room metadata.",
    required: "essential",
    retention: "Until you reset or clear browser storage.",
  },
  {
    key: "typeshift.focusPrefs.v1 / typeshift.cipherPrefs.v1 / typeshift.pulsePrefs.v1 / typeshift.soundPack.v1 / typeshift.accessibilityPreset.v1 / typeshift.a11yPrefs.v1",
    purpose: "Stores non-essential comfort settings only when you opt into comfort setting storage.",
    required: "optional",
    retention: "Until you disable comfort storage or clear browser storage.",
  },
  {
    key: "typeshift.weaknessMap.v1 / typeshift.keyStats.v1",
    purpose: "Stores local training analytics such as weak patterns and per-key performance.",
    required: "optional",
    retention: "Until you disable comfort storage or clear browser storage.",
  },
];

export const analyticsEvents = [
  "page_view",
  "mode_select",
  "run_start",
  "run_finish",
  "auth_register",
  "auth_login",
  "consent_update",
] as const;

function containsPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("example.com") ||
    normalized.includes("set your") ||
    normalized.includes("set-your")
  );
}

export function getLegalConfig(): LegalConfig {
  const config: LegalConfig = {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || defaultConfig.siteName,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || defaultConfig.siteUrl,
    controllerName: process.env.NEXT_PUBLIC_CONTROLLER_NAME || defaultConfig.controllerName,
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || defaultConfig.contactEmail,
    contactAddress: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || defaultConfig.contactAddress,
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || defaultConfig.supportEmail,
    dpoEmail: process.env.NEXT_PUBLIC_DPO_EMAIL || defaultConfig.dpoEmail,
    lastUpdated: process.env.NEXT_PUBLIC_LEGAL_LAST_UPDATED || defaultConfig.lastUpdated,
    scoreRetentionDays: defaultConfig.scoreRetentionDays,
    telemetryRetentionDays: defaultConfig.telemetryRetentionDays,
  };

  if (process.env.NODE_ENV === "production") {
    const requiredFields = [
      config.siteUrl,
      config.controllerName,
      config.contactEmail,
      config.contactAddress,
      config.supportEmail,
    ];
    if (requiredFields.some(containsPlaceholder)) {
      throw new Error("Legal controller details must be configured before production release");
    }
  }

  return config;
}
