import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import findFoodSwipes from "@/api/foods/services/findFoodSwipes";
import { awardSwipe } from "@/api/prizes/services/tickets";
import { toLocalDay } from "@/api/swipe-list/services/getSwipeGame";
import FoodEntity from "@/entities/FoodEntity";
import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity, { RaceAnswer, RaceRunAnswer } from "@/entities/RaceRunEntity";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { EntityManager, In, Not } from "typeorm";

export const RACE_SIZE = 10;
const MAX_ANSWER_MS = 120000;

export const ANSWERS: RaceAnswer[] = ["in", "out", "up"];

export type Verdict = { result: "needed" | "stocked" | "tied"; out: number; in: number };

export const verdictOf = (answers: RaceAnswer[]): Verdict | null => {
  const out = answers.filter((answer) => answer === "out").length;
  const inStock = answers.filter((answer) => answer === "in").length;
  if (out + inStock === 0) return null;
  const result = out > inStock ? "needed" : inStock > out ? "stocked" : "tied";
  return { result, out, in: inStock };
};

export const totalOf = (answers: RaceRunAnswer[]) =>
  answers.reduce((total, answer) => total + answer.ms, 0);

export const splitsOf = (answers: RaceRunAnswer[]) => {
  let elapsed = 0;
  return answers.map((answer) => (elapsed += answer.ms));
};

const isDuplicate = (error: unknown) =>
  (error as { code?: string })?.code === "ER_DUP_ENTRY";

export const householdMembers = (householdId: number, m: EntityManager) =>
  m.find(UserEntity, {
    where: { household: { id: householdId } },
    select: { id: true, username: true },
    order: { id: "ASC" },
  });

export const getOrCreateRace = async (
  householdId: number,
  day: string,
  m: EntityManager,
): Promise<RaceEntity | null> => {
  const where = { household: { id: householdId }, day };
  const existing = await m.findOne(RaceEntity, { where });
  if (existing) return existing;

  const foods = await findFoodSwipes(householdId, { take: RACE_SIZE }, m);
  if (foods.length === 0) return null;

  try {
    return await m.save(RaceEntity, {
      household: { id: householdId },
      day,
      foodIds: foods.map((food) => food.id),
    });
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    return m.findOne(RaceEntity, { where });
  }
};

const raceFoods = async (race: RaceEntity, householdId: number, m: EntityManager) => {
  const foods = await m.find(FoodEntity, {
    where: { id: In(race.foodIds), household: { id: householdId } },
  });
  const byId = new Map(foods.map((food) => [food.id, food]));
  return race.foodIds.map((id) => byId.get(id)).filter((food) => food !== undefined);
};

const runsOf = (raceIds: number[], m: EntityManager) =>
  raceIds.length
    ? m.find(RaceRunEntity, {
        where: { race: { id: In(raceIds) } },
        relations: { user: true, race: true },
        order: { id: "ASC" },
      })
    : Promise.resolve([] as RaceRunEntity[]);

export const householdRaces = async (householdId: number, m: EntityManager) => {
  const races = await m.find(RaceEntity, {
    where: { household: { id: householdId } },
    order: { day: "ASC" },
  });
  const runs = await runsOf(races.map((race) => race.id), m);
  return races.map((race) => ({
    race,
    runs: runs.filter((run) => run.race.id === race.id),
  }));
};

const publicRun = (run: RaceRunEntity) => ({
  userId: run.user.id,
  username: run.user.username,
  answers: run.answers,
  totalMs: run.totalMs ?? null,
  finished: Boolean(run.finishedAt),
});

export const raceView = async (user: UserEntity, tzOffset: number) => {
  const m = AppDataSource.manager;
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

const toHistoryStock = (answer: RaceAnswer) =>
  answer === "in" ? true : answer === "out" ? false : null;

export const answerRace = async (
  user: UserEntity,
  raceId: number,
  input: { foodId: unknown; answer: unknown; ms: unknown },
) => {
  const foodId = Number(input.foodId);
  const answer = input.answer as RaceAnswer;
  if (!Number.isInteger(foodId)) throw ApiError("A food id is required");
  if (!ANSWERS.includes(answer)) throw ApiError("answer must be in, out or up");
  const ms = Math.min(MAX_ANSWER_MS, Math.max(0, Math.round(Number(input.ms) || 0)));
  const householdId = user.household.id;

  const outcome = await AppDataSource.manager.transaction(async (m) => {
    const race = await m.findOne(RaceEntity, {
      where: { id: raceId, household: { id: householdId } },
    });
    if (!race) throw Missing(`Race ${raceId} not found`);
    if (!race.foodIds.includes(foodId)) throw ApiError("This food is not in the race");

    let run = await m.findOne(RaceRunEntity, {
      where: { race: { id: race.id }, user: { id: user.id } },
      lock: { mode: "pessimistic_write" },
    });
    if (!run) {
      try {
        run = await m.save(
          m.create(RaceRunEntity, {
            race: { id: race.id },
            user: { id: user.id },
            answers: [],
          }),
        );
      } catch (error) {
        if (!isDuplicate(error)) throw error;
        run = await m.findOneOrFail(RaceRunEntity, {
          where: { race: { id: race.id }, user: { id: user.id } },
        });
      }
    }
    if (run.finishedAt) throw ApiError(409, "You already finished today's race");

    const fresh = !run.answers.some((entry) => entry.foodId === foodId);
    if (fresh) {
      run.answers = [...run.answers, { foodId, answer, ms }];
      await createFoodHistory({ foodId, isInStock: toHistoryStock(answer), userId: user.id }, m);

      const stillThere = await m.count(FoodEntity, {
        where: { id: In(race.foodIds), household: { id: householdId } },
      });
      if (run.answers.length >= stillThere) {
        run.totalMs = totalOf(run.answers);
        run.finishedAt = new Date();
      }
      await m.save(RaceRunEntity, run);
    }

    const others = await m.find(RaceRunEntity, {
      where: { race: { id: race.id }, user: { id: Not(user.id) } },
      relations: { user: true },
    });
    const mates = others
      .map((other) => ({
        userId: other.user.id,
        username: other.user.username,
        vote: other.answers.find((entry) => entry.foodId === foodId),
      }))
      .filter((mate) => mate.vote)
      .map((mate) => ({
        userId: mate.userId,
        username: mate.username,
        answer: mate.vote!.answer,
        ms: mate.vote!.ms,
      }));
    const mine = run.answers.find((entry) => entry.foodId === foodId)!;

    return {
      fresh,
      finished: Boolean(run.finishedAt),
      totalMs: run.totalMs ?? null,
      mates,
      verdict: verdictOf([mine.answer, ...mates.map((mate) => mate.answer)]),
    };
  });

  const reward = outcome.fresh
    ? await awardSwipe(user.id, foodId).catch((error) => {
        console.error("Failed to award race tickets", error);
        return { earned: 0, bonus: 0, balance: null };
      })
    : { earned: 0, bonus: 0, balance: null };

  return {
    reward,
    finished: outcome.finished,
    totalMs: outcome.totalMs,
    mates: outcome.mates,
    verdict: outcome.verdict,
  };
};
