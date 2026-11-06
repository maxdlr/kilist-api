import { toLocalDay } from "@/api/swipe-list/services/getSwipeGame";
import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity, { RaceAnswer } from "@/entities/RaceRunEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { householdMembers, householdRaces, verdictOf } from "./race";
import { shopRuns } from "./shop";

type RaceWithRuns = { race: RaceEntity; runs: RaceRunEntity[] };

const DAY_MS = 24 * 3600000;
const RECENT_DAYS = 30;

const finished = (runs: RaceRunEntity[]) => runs.filter((run) => run.finishedAt);

const majorityOf = (runs: RaceRunEntity[], foodId: number): RaceAnswer | null => {
  const answers = runs
    .map((run) => run.answers.find((entry) => entry.foodId === foodId)?.answer)
    .filter((answer): answer is RaceAnswer => answer !== undefined && answer !== "up");
  if (answers.length < 2) return null;
  const verdict = verdictOf(answers);
  if (!verdict || verdict.result === "tied") return null;
  return verdict.result === "needed" ? "out" : "in";
};

const winnersOf = (runs: RaceRunEntity[]) => {
  const done = finished(runs);
  if (done.length < 2) return [];
  const best = Math.min(...done.map((run) => run.totalMs ?? Infinity));
  return done.filter((run) => run.totalMs === best).map((run) => run.user.id);
};

const dayOffset = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);

export const standings = async (
  user: UserEntity,
  tzOffset: number,
  period: "week" | "season",
) => {
  const m = AppDataSource.manager;
  const today = toLocalDay(new Date(), tzOffset);
  const members = await householdMembers(user.household.id, m);
  const history = await householdRaces(user.household.id, m);
  const since = period === "week" ? dayOffset(today, 6) : "";
  const inPeriod = history.filter(({ race }) => race.day >= since);

  const rows = members.map((member) => {
    let wins = 0;
    let plays = 0;
    let totalMs = 0;
    let right = 0;
    let judged = 0;

    for (const { runs } of inPeriod) {
      const run = runs.find((entry) => entry.user.id === member.id && entry.finishedAt);
      if (!run) continue;
      plays += 1;
      totalMs += run.totalMs ?? 0;
      if (winnersOf(runs).includes(member.id)) wins += 1;
      for (const answer of run.answers) {
        if (answer.answer === "up") continue;
        const majority = majorityOf(finished(runs), answer.foodId);
        if (!majority) continue;
        judged += 1;
        if (majority === answer.answer) right += 1;
      }
    }

    return {
      userId: member.id,
      username: member.username,
      wins,
      plays,
      avgMs: plays ? Math.round(totalMs / plays) : null,
      rightPct: judged ? Math.round((right / judged) * 100) : null,
    };
  });

  const todayRace = history.find(({ race }) => race.day === today);
  return {
    period,
    day: today,
    members: rows.sort((a, b) => b.wins - a.wins || (a.avgMs ?? Infinity) - (b.avgMs ?? Infinity)),
    today: members.map((member) => {
      const run = todayRace?.runs.find((entry) => entry.user.id === member.id);
      return {
        userId: member.id,
        username: member.username,
        played: Boolean(run?.finishedAt),
        totalMs: run?.finishedAt ? run.totalMs ?? null : null,
      };
    }),
    lastClash: lastClash(history),
  };
};

const lastClash = (history: RaceWithRuns[]) => {
  for (const { race, runs } of [...history].reverse()) {
    const done = finished(runs);
    for (const foodId of [...race.foodIds].reverse()) {
      const votes = done
        .map((run) => ({ run, answer: run.answers.find((entry) => entry.foodId === foodId)?.answer }))
        .filter((vote) => vote.answer && vote.answer !== "up");
      const kinds = new Set(votes.map((vote) => vote.answer));
      if (kinds.size < 2) continue;
      return {
        day: race.day,
        foodId,
        votes: votes.map((vote) => ({ userId: vote.run.user.id, username: vote.run.user.username, answer: vote.answer })),
        verdict: verdictOf(votes.map((vote) => vote.answer as RaceAnswer)),
      };
    }
  }
  return null;
};

const streakOf = (days: Set<string>, today: string) => {
  let cursor = days.has(today) ? today : dayOffset(today, 1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = dayOffset(cursor, 1);
  }
  return streak;
};

export const meStats = async (user: UserEntity, tzOffset: number) => {
  const m = AppDataSource.manager;
  const today = toLocalDay(new Date(), tzOffset);
  const members = await householdMembers(user.household.id, m);
  const history = await householdRaces(user.household.id, m);
  const shops = await shopRuns(user.household.id, m);

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
