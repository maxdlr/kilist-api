import { toLocalDay } from "@/helpers/localDay";
import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity, { RaceAnswer } from "@/entities/RaceRunEntity";
import UserEntity from "@/entities/UserEntity";
import { EntityManager } from "typeorm";
import { dayOffset, finished, majorityOf } from "../helpers";
import householdMembers from "./householdMembers";
import householdRaces from "./householdRaces";
import shopRuns from "./shopRuns";

const RECENT_DAYS = 30;

const streakOf = (days: Set<string>, today: string) => {
  let cursor = days.has(today) ? today : dayOffset(today, 1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = dayOffset(cursor, 1);
  }
  return streak;
};

const meStats = async (user: UserEntity, tzOffset: number, manager?: EntityManager) => {
  const today = toLocalDay(new Date(), tzOffset);
  const members = await householdMembers(user.household.id, manager);
  const history = await householdRaces(user.household.id, manager);
  const shops = await shopRuns(user.household.id, manager);

  const myRuns = history
    .map(({ race, runs }) => ({ race, run: runs.find((run) => run.user.id === user.id && run.finishedAt) }))
    .filter((entry): entry is { race: RaceEntity; run: RaceRunEntity } => Boolean(entry.run));

  const bestShop = (userId: number) => {
    const times = shops.filter((shop) => shop.userId === userId).map((shop) => shop.ms);
    return times.length ? Math.min(...times) : null;
  };

  const headToHead = members
    .filter((member) => member.id !== user.id)
    .map((rival) => {
      let mine = 0;
      let theirs = 0;
      let clashes = 0;
      let rightInClashes = 0;
      for (const { race, runs } of history) {
        const me = runs.find((run) => run.user.id === user.id && run.finishedAt);
        const them = runs.find((run) => run.user.id === rival.id && run.finishedAt);
        if (!me || !them) continue;
        if ((me.totalMs ?? 0) < (them.totalMs ?? 0)) mine += 1;
        else if ((them.totalMs ?? 0) < (me.totalMs ?? 0)) theirs += 1;
        for (const foodId of race.foodIds) {
          const a = me.answers.find((entry) => entry.foodId === foodId)?.answer;
          const b = them.answers.find((entry) => entry.foodId === foodId)?.answer;
          if (!a || !b || a === "up" || b === "up" || a === b) continue;
          clashes += 1;
          if (majorityOf(finished(runs), foodId) === a) rightInClashes += 1;
        }
      }
      const myShop = bestShop(user.id);
      const theirShop = bestShop(rival.id);
      return {
        userId: rival.id,
        username: rival.username,
        wins: mine,
        losses: theirs,
        clashes,
        rightInClashes,
        shopRecord:
          myShop === null && theirShop === null
            ? null
            : theirShop === null || (myShop !== null && myShop <= theirShop)
              ? "you"
              : "them",
      };
    });

  const previous: Record<number, RaceAnswer> = {};
  let changed = 0;
  let compared = 0;
  const recentSince = dayOffset(today, RECENT_DAYS);
  for (const { race, run } of myRuns) {
    for (const answer of run.answers) {
      const before = previous[answer.foodId];
      if (before && race.day >= recentSince) {
        compared += 1;
        if (before !== answer.answer) changed += 1;
      }
      previous[answer.foodId] = answer.answer;
    }
  }

  let best = Infinity;
  let newBests = 0;
  for (const { race, run } of myRuns) {
    const time = run.totalMs ?? Infinity;
    if (time < best) {
      if (best !== Infinity && race.day >= recentSince) newBests += 1;
      best = time;
    }
  }

  const recent = myRuns.slice(-10).map(({ race, run }) => ({ day: race.day, totalMs: run.totalMs ?? 0 }));

  return {
    headToHead,
    personal: {
      bestRaceMs: best === Infinity ? null : best,
      bestShopMs: bestShop(user.id),
      streak: streakOf(new Set(myRuns.map(({ race }) => race.day)), today),
      changedMindPct: compared ? Math.round((changed / compared) * 100) : null,
      newBests,
      recent,
    },
  };
};

export default meStats;
