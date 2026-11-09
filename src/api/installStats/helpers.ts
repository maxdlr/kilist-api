export const COUNTERS = [
  "foods",
  "rounds",
  "cards",
  "runs",
  "suggestionsTaken",
  "errors",
  "gatesHousehold",
  "gatesVersus",
  "signups",
  "signupsAfterGate",
] as const;

export type InstallStatInput = {
  installId: string;
  day: string;
  appVersion: string;
  platform: string;
  guest: boolean;
  skin: string;
} & Record<(typeof COUNTERS)[number], number>;

export const RETENTION_DAYS = 400;
export const MAX_DAYS_PER_REQUEST = 31;
const MAX_COUNT = 100000;
const ID_PATTERN = /^[0-9a-f-]{16,64}$/i;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const text = (value: unknown, length: number) =>
  typeof value === "string" ? value.slice(0, length) : "";

const count = (value: unknown) =>
  Math.min(MAX_COUNT, Math.max(0, Math.floor(Number(value) || 0)));

export const parseInstallStat = (raw: unknown, installId: unknown): InstallStatInput | null => {
  if (typeof raw !== "object" || raw === null) return null;
  const entry = raw as Record<string, unknown>;
  if (typeof installId !== "string" || !ID_PATTERN.test(installId)) return null;
  if (typeof entry.day !== "string" || !DAY_PATTERN.test(entry.day)) return null;
  const counters = Object.fromEntries(COUNTERS.map((key) => [key, count(entry[key])])) as Record<
    (typeof COUNTERS)[number],
    number
  >;
  return {
    installId,
    day: entry.day,
    appVersion: text(entry.appVersion, 32),
    platform: text(entry.platform, 16),
    guest: entry.guest !== false,
    skin: text(entry.skin, 32),
    ...counters,
  };
};
