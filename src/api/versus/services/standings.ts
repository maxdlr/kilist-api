import { toLocalDay } from "@/helpers/localDay";
import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity, { RaceAnswer } from "@/entities/RaceRunEntity";
import UserEntity from "@/entities/UserEntity";
import { EntityManager } from "typeorm";
import { dayOffset, finished, majorityOf, verdictOf } from "../helpers";
import householdMembers from "./householdMembers";
import householdRaces from "./householdRaces";

type RaceWithRuns = { race: RaceEntity; runs: RaceRunEntity[] };

const winnersOf = (runs: RaceRunEntity[]) => {
  const done = finished(runs);
  if (done.length < 2) return [];
  const best = Math.min(...done.map((run) => run.totalMs ?? Infinity));
  return done.filter((run) => run.totalMs === best).map((run) => run.user.id);
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

const standings = async (
  user: UserEntity,
  tzOffset: number,
  period: "week" | "season",
  manager?: EntityManager,
) => {
  const today = toLocalDay(new Date(), tzOffset);
  const members = await householdMembers(user.household.id, manager);
  const history = await householdRaces(user.household.id, manager);
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

export default standings;
