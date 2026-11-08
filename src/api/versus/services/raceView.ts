import { toLocalDay } from "@/helpers/localDay";
import FoodEntity from "@/entities/FoodEntity";
import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity, { RaceAnswer, RaceRunAnswer } from "@/entities/RaceRunEntity";
import UserEntity from "@/entities/UserEntity";
import RaceRepository from "@/repositories/RaceRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In } from "typeorm";
import getOrCreateRace from "./getOrCreateRace";
import householdMembers from "./householdMembers";
import householdRaces from "./householdRaces";

const splitsOf = (answers: RaceRunAnswer[]) => {
  let elapsed = 0;
  return answers.map((answer) => (elapsed += answer.ms));
};

const raceFoods = async (race: RaceEntity, householdId: number, m: EntityManager) => {
  const foods = await m.find(FoodEntity, {
    where: { id: In(race.foodIds), household: { id: householdId } },
  });
  const byId = new Map(foods.map((food) => [food.id, food]));
  return race.foodIds.map((id) => byId.get(id)).filter((food) => food !== undefined);
};

const publicRun = (run: RaceRunEntity) => ({
  userId: run.user.id,
  username: run.user.username,
  answers: run.answers,
  totalMs: run.totalMs ?? null,
  finished: Boolean(run.finishedAt),
});

const raceView = async (user: UserEntity, tzOffset: number, manager?: EntityManager) => {
  const m = findManager(RaceRepository, manager);
  const householdId = user.household.id;
  const day = toLocalDay(new Date(), tzOffset);
  const members = await householdMembers(householdId, m);
  const race = await getOrCreateRace(householdId, day, m);
  const history = await householdRaces(householdId, m);

  const myFinishedDays = new Set(
    history
      .filter(({ runs }) => runs.some((run) => run.user.id === user.id && run.finishedAt))
      .map(({ race: past }) => past.day),
  );
  const level = myFinishedDays.size + (myFinishedDays.has(day) ? 0 : 1);

  const todayRuns = history.find(({ race: entry }) => entry.id === race?.id)?.runs ?? [];
  const pastRuns = history
    .filter(({ race: entry }) => entry.id !== race?.id)
    .flatMap(({ runs }) => runs);

  const mates = todayRuns.filter((run) => run.user.id !== user.id && run.finishedAt);
  const fastestMate = mates.sort((a, b) => (a.totalMs ?? 0) - (b.totalMs ?? 0))[0];
  const myBest = pastRuns
    .filter((run) => run.user.id === user.id && run.finishedAt)
    .sort((a, b) => (a.totalMs ?? 0) - (b.totalMs ?? 0))[0];

  let target = null;
  if (members.length > 1 && fastestMate) {
    target = {
      kind: "mate" as const,
      userId: fastestMate.user.id,
      username: fastestMate.user.username,
      totalMs: fastestMate.totalMs,
      splits: splitsOf(fastestMate.answers),
    };
  } else if (members.length === 1 && myBest) {
    target = {
      kind: "best" as const,
      userId: user.id,
      username: user.username,
      totalMs: myBest.totalMs,
      splits: splitsOf(myBest.answers),
      day: myBest.race.day,
    };
  }

  const previousAnswers: Record<number, { answer: RaceAnswer; day: string }> = {};
  for (const run of pastRuns.filter((entry) => entry.user.id === user.id)) {
    for (const answer of run.answers) {
      previousAnswers[answer.foodId] = { answer: answer.answer, day: run.race.day };
    }
  }

  return {
    day,
    level,
    raceId: race?.id ?? null,
    foods: race ? await raceFoods(race, householdId, m) : [],
    members,
    runs: todayRuns.map(publicRun),
    target,
    previousAnswers,
  };
};

export default raceView;
