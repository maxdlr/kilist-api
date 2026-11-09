import InstallStatEntity from "@/entities/InstallStatEntity";
import InstallStatRepository from "@/repositories/InstallStatRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const DAY = 24 * 3600000;

const dayOf = (offset: number) => new Date(Date.now() - offset * DAY).toISOString().slice(0, 10);
const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const rate = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null);
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
};
const sum = (rows: InstallStatEntity[], key: keyof InstallStatEntity) =>
  rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
const split = (values: string[]) => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value || "?", (counts.get(value || "?") ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, share: rate(count, values.length) }))
    .sort((a, b) => b.count - a.count);
};

const installStats = async (days: number, manager?: EntityManager) => {
  const m = findManager(InstallStatRepository, manager);
  const all = await m.find(InstallStatEntity, { order: { day: "ASC" } });
  const since = days ? dayOf(days - 1) : "0000-00-00";
  const period = all.filter((row) => row.day >= since);

  const byInstall = new Map<string, InstallStatEntity[]>();
  for (const row of all) byInstall.set(row.installId, [...(byInstall.get(row.installId) ?? []), row]);
  const latest = [...byInstall.values()].map((rows) => rows[rows.length - 1]!);
  const recentLatest = latest.filter((row) => row.day >= since);

  const activeOn = (from: string) => new Set(all.filter((row) => row.day >= from).map((row) => row.installId)).size;
  const today = dayOf(0);

  const retention = (after: number) => {
    const cohort = [...byInstall.values()].filter((rows) => addDays(rows[0]!.day, after) <= today);
    const back = cohort.filter((rows) => rows.some((row) => row.day >= addDays(rows[0]!.day, after)));
    return { rate: rate(back.length, cohort.length), cohort: cohort.length };
  };

  const rounds = sum(period, "rounds");
  const gates = sum(period, "gatesHousehold") + sum(period, "gatesVersus");

  return {
    period: days,
    active: { today: activeOn(today), week: activeOn(dayOf(6)), month: activeOn(dayOf(29)) },
    newInstalls: [...byInstall.values()].filter((rows) => rows[0]!.day >= since).length,
    guests: { guest: recentLatest.filter((row) => row.guest).length, account: recentLatest.filter((row) => !row.guest).length },
    retention: { day1: retention(1), day7: retention(7), day30: retention(30) },
    rounds,
    cardsPerRound: rounds ? Math.round(sum(period, "cards") / rounds) : null,
    runs: sum(period, "runs"),
    suggestionsTaken: sum(period, "suggestionsTaken"),
    foodsPerInventory: median(recentLatest.map((row) => row.foods)),
    skins: split(recentLatest.map((row) => row.skin)),
    gates: {
      household: sum(period, "gatesHousehold"),
      versus: sum(period, "gatesVersus"),
      signups: sum(period, "signups"),
      signupsAfterGate: sum(period, "signupsAfterGate"),
      conversion: rate(sum(period, "signupsAfterGate"), gates),
    },
    versions: split(recentLatest.map((row) => row.appVersion)),
    errors: sum(period, "errors"),
  };
};

export default installStats;
