import { PRIZES } from "@/api/prizes/catalog";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const DAY = 24 * 60 * 60 * 1000;
const NEAR_UNLOCK = 100;

type Row = Record<string, unknown>;

const num = (value: unknown) => Number(value ?? 0);
const date = (value: unknown) => (value ? new Date(value as string) : null);
const rate = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null);
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : Math.round((sorted[middle - 1]! + sorted[middle]!) / 2);
};
const parse = <T>(value: unknown): T | null => {
  if (!value) return null;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const adminStats = async (days: number, manager?: EntityManager) => {
  const m = findManager(UserRepository, manager);
  const q = <T extends Row>(sql: string, params: unknown[] = []) => m.query(sql, params) as Promise<T[]>;
  const now = Date.now();
  const since = new Date(days > 0 ? now - days * DAY : 0);
  const weekAgo = new Date(now - 7 * DAY);
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const [
    users,
    everyHousehold,
    foodsPerHousehold,
    foodsEverPerHousehold,
    answerSpans,
    tripSpans,
    raceSpans,
    activeRows,
    answerKinds,
    notSure,
    games,
    trips,
    ticketTotals,
    balances,
    unlocks,
    noIcon,
    noIconNames,
    foodTotal,
  ] = await Promise.all([
    q("SELECT id, createdAt, language, deviceLanguage, skin, householdId FROM users"),
    q("SELECT id, createdAt, deletedAt FROM households"),
    q("SELECT householdId, COUNT(*) AS total FROM foods WHERE deletedAt IS NULL GROUP BY householdId"),
    q("SELECT householdId, COUNT(*) AS total FROM foods GROUP BY householdId"),
    q("SELECT userId, MIN(createdAt) AS first, MAX(createdAt) AS last FROM food_histories WHERE userId IS NOT NULL GROUP BY userId"),
    q("SELECT userId, MIN(createdAt) AS first, MAX(createdAt) AS last FROM `shop-list` WHERE userId IS NOT NULL GROUP BY userId"),
    q("SELECT userId, MAX(createdAt) AS last FROM race_runs GROUP BY userId"),
    q(
      `SELECT DISTINCT userId, at FROM (
         SELECT userId, createdAt AS at FROM food_histories WHERE userId IS NOT NULL AND createdAt >= ?
         UNION ALL SELECT userId, createdAt FROM \`shop-list\` WHERE userId IS NOT NULL AND createdAt >= ?
         UNION ALL SELECT userId, createdAt FROM race_runs WHERE createdAt >= ?
       ) activity`,
      [weekAgo, weekAgo, weekAgo],
    ),
    q("SELECT isInStock, COUNT(*) AS total FROM food_histories WHERE createdAt >= ? GROUP BY isInStock", [since]),
    q(
      `SELECT f.name AS name, COUNT(*) AS total FROM food_histories h JOIN foods f ON f.id = h.foodId
       WHERE h.isInStock IS NULL AND h.createdAt >= ? GROUP BY f.name ORDER BY total DESC LIMIT 3`,
      [since],
    ),
    q("SELECT status, COUNT(*) AS total FROM `swipe-list` WHERE createdAt >= ? GROUP BY status", [since]),
    q("SELECT buyLog, suggestionLog FROM `shop-list` WHERE createdAt >= ?", [since]),
    q(
      `SELECT COALESCE(SUM(CASE WHEN amount > 0 AND reason <> 'admin' THEN amount ELSE 0 END), 0) AS earned,
              COALESCE(SUM(CASE WHEN reason = 'redeem' THEN -amount ELSE 0 END), 0) AS spent,
              COALESCE(SUM(CASE WHEN reason = 'admin' THEN amount ELSE 0 END), 0) AS gifted
       FROM ticket_entries WHERE createdAt >= ?`,
      [since],
    ),
    q("SELECT userId, SUM(amount) AS balance FROM ticket_entries GROUP BY userId"),
    q("SELECT userId, prizeId, source FROM unlocks"),
    q("SELECT COUNT(*) AS total FROM foods WHERE icon IS NULL AND deletedAt IS NULL"),
    q("SELECT name, COUNT(*) AS total FROM foods WHERE icon IS NULL AND deletedAt IS NULL GROUP BY name ORDER BY total DESC LIMIT 5"),
    q("SELECT COUNT(*) AS total FROM foods WHERE deletedAt IS NULL"),
  ]);

  const firstAnswer = new Map(answerSpans.map((row) => [num(row.userId), date(row.first)!]));
  const firstTrip = new Map(tripSpans.map((row) => [num(row.userId), date(row.first)!]));
  const lastActive = new Map<number, Date>();
  for (const row of [...answerSpans, ...tripSpans, ...raceSpans]) {
    const id = num(row.userId);
    const last = date(row.last);
    if (last && (!lastActive.get(id) || last > lastActive.get(id)!)) lastActive.set(id, last);
  }

  const memberCount = new Map<number, number>();
  for (const user of users) memberCount.set(num(user.householdId), (memberCount.get(num(user.householdId)) ?? 0) + 1);
  const foodCount = new Map(foodsPerHousehold.map((row) => [num(row.householdId), num(row.total)]));
  const foodEverCount = new Map(foodsEverPerHousehold.map((row) => [num(row.householdId), num(row.total)]));
  const households = everyHousehold.filter((home) => !home.deletedAt);
  const deletedHouseholds = everyHousehold.filter((home) => home.deletedAt && date(home.deletedAt)! >= since);

  const created = (row: Row) => date(row.createdAt)!;
  const newUsers = users.filter((user) => created(user) >= since);
  const newHouseholds = everyHousehold.filter((home) => created(home) >= since);
  const olderThan = (row: Row, ms: number) => now - created(row).getTime() >= ms;

  const signups = Array.from({ length: 30 }, (_, index) => {
    const start = new Date(today.getTime() - (29 - index) * DAY);
    const end = new Date(start.getTime() + DAY);
    return { day: start.toISOString().slice(0, 10), count: users.filter((user) => created(user) >= start && created(user) < end).length };
  });

  const cohort24 = newUsers.filter((user) => olderThan(user, DAY));
  const cohort7 = newUsers.filter((user) => olderThan(user, 7 * DAY));
  const within = (map: Map<number, Date>, user: Row, ms: number) => {
    const first = map.get(num(user.id));
    return !!first && first.getTime() - created(user).getTime() <= ms;
  };
  const retention = (n: number) => {
    const cohort = users.filter((user) => olderThan(user, n * DAY));
    const kept = cohort.filter((user) => {
      const last = lastActive.get(num(user.id));
      return !!last && last.getTime() - created(user).getTime() >= n * DAY;
    });
    return { rate: rate(kept.length, cohort.length), cohort: cohort.length };
  };

  const activeWeek = new Set(activeRows.map((row) => num(row.userId)));
  const activeToday = new Set(activeRows.filter((row) => date(row.at)! >= today).map((row) => num(row.userId)));
  const skinsInUse = new Map<string, number>();
  for (const user of users) {
    if (!activeWeek.has(num(user.id))) continue;
    skinsInUse.set(String(user.skin), (skinsInUse.get(String(user.skin)) ?? 0) + 1);
  }

  const answerCount = answerKinds.reduce((sum, row) => sum + num(row.total), 0);
  const unsureCount = num(answerKinds.find((row) => row.isInStock === null)?.total);
  const gameCount = games.reduce((sum, row) => sum + num(row.total), 0);
  const gamesDone = num(games.find((row) => row.status === "completed")?.total);

  const boughtTrips = trips
    .map((trip) => parse<{ foodId: number; at: string }[]>(trip.buyLog) ?? [])
    .filter((log) => log.length > 0);
  const suggestions = trips.flatMap((trip) => parse<{ foodId: number; taken: boolean }[]>(trip.suggestionLog) ?? []);
  const boughtCounts = new Map<number, number>();
  for (const log of boughtTrips) for (const entry of log) boughtCounts.set(entry.foodId, (boughtCounts.get(entry.foodId) ?? 0) + 1);
  const topIds = [...boughtCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topNames = topIds.length
    ? new Map((await q("SELECT id, name FROM foods WHERE id IN (?)", [topIds.map(([id]) => id)])).map((row) => [num(row.id), String(row.name)]))
    : new Map<number, string>();

  const balanceOf = new Map(balances.map((row) => [num(row.userId), num(row.balance)]));
  const premium = PRIZES.filter((prize) => prize.kind === "skin" && prize.price > 0);
  const owned = new Set(unlocks.map((row) => `${num(row.userId)}:${row.prizeId}`));
  const nearUnlock = users.filter((user) => {
    const balance = balanceOf.get(num(user.id)) ?? 0;
    return premium.some(
      (prize) => !owned.has(`${num(user.id)}:${prize.id}`) && balance < prize.price && balance >= prize.price - NEAR_UNLOCK,
    );
  }).length;
  const allBalances = users.map((user) => balanceOf.get(num(user.id)) ?? 0);

  return {
    period: days,
    growth: {
      users: users.length,
      newUsers: newUsers.length,
      households: households.length,
      newHouseholds: newHouseholds.length,
      deletedHouseholds: deletedHouseholds.length,
      foods: num(foodTotal[0]?.total),
      peoplePerHousehold: households.length ? Math.round((users.length / households.length) * 10) / 10 : null,
      soloHouseholds: [...memberCount.values()].filter((count) => count === 1).length,
      sharedHouseholds: [...memberCount.values()].filter((count) => count > 1).length,
      signups,
      languages: {
        fr: users.filter((user) => user.language === "fr").length,
        en: users.filter((user) => user.language === "en").length,
        phone: users.filter((user) => !user.language).length,
        phoneFr: users.filter((user) => !user.language && user.deviceLanguage === "fr").length,
        phoneEn: users.filter((user) => !user.language && user.deviceLanguage === "en").length,
      },
    },
    firstDays: {
      pickedFive: { rate: rate(newHouseholds.filter((home) => (foodEverCount.get(num(home.id)) ?? 0) >= 5).length, newHouseholds.length), cohort: newHouseholds.length },
      firstGame: { rate: rate(cohort24.filter((user) => within(firstAnswer, user, DAY)).length, cohort24.length), cohort: cohort24.length },
      firstTrip: { rate: rate(cohort7.filter((user) => within(firstTrip, user, 7 * DAY)).length, cohort7.length), cohort: cohort7.length },
      retention: { day1: retention(1), day7: retention(7), day30: retention(30) },
    },
    use: {
      activeToday: activeToday.size,
      activeWeek: activeWeek.size,
      gamesFinished: rate(gamesDone, gameCount),
      unsure: rate(unsureCount, answerCount),
      mostUnsure: notSure.map((row) => String(row.name)),
      skins: [...skinsInUse.entries()].sort((a, b) => b[1] - a[1]).map(([skin, count]) => ({ skin, share: rate(count, activeWeek.size) })),
    },
    shopping: {
      trips: boughtTrips.length,
      itemsPerTrip: median(boughtTrips.map((log) => log.length)),
      tripMinutes: median(
        boughtTrips
          .filter((log) => log.length > 1)
          .map((log) => Math.round((new Date(log.at(-1)!.at).getTime() - new Date(log[0]!.at).getTime()) / 60000)),
      ),
      suggestionsShown: suggestions.length,
      suggestionsTaken: rate(suggestions.filter((entry) => entry.taken).length, suggestions.length),
      mostBought: topIds.map(([id, count]) => ({ name: topNames.get(id) ?? `#${id}`, count })),
    },
    business: {
      earned: num(ticketTotals[0]?.earned),
      spent: num(ticketTotals[0]?.spent),
      givenByAdmins: num(ticketTotals[0]?.gifted),
      averageBalance: allBalances.length ? Math.round(allBalances.reduce((sum, value) => sum + value, 0) / allBalances.length) : 0,
      nearUnlock,
      unlocks: premium.map((prize) => {
        const rows = unlocks.filter((row) => row.prizeId === prize.id);
        return {
          skin: prize.skin,
          total: rows.length,
          points: rows.filter((row) => row.source === "points").length,
          gift: rows.filter((row) => row.source === "gift").length,
          purchase: rows.filter((row) => row.source === "purchase").length,
        };
      }),
    },
    health: {
      foodsWithoutIcon: num(noIcon[0]?.total),
      topMissingIcons: noIconNames.map((row) => String(row.name)),
      emptyHouseholds: households.filter((home) => !foodCount.get(num(home.id))).length,
      neverActive: users.filter((user) => !lastActive.has(num(user.id))).length,
    },
  };
};

export default adminStats;
