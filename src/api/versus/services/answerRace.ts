import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import awardSwipe from "@/api/prizes/services/awardSwipe";
import FoodEntity from "@/entities/FoodEntity";
import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity, { RaceAnswer, RaceRunAnswer } from "@/entities/RaceRunEntity";
import UserEntity from "@/entities/UserEntity";
import doTransaction from "@/utils/doTransaction";
import { In, Not } from "typeorm";
import { isDuplicate, verdictOf } from "../helpers";

const MAX_ANSWER_MS = 120000;
const ANSWERS: RaceAnswer[] = ["in", "out", "up"];

const totalOf = (answers: RaceRunAnswer[]) =>
  answers.reduce((total, answer) => total + answer.ms, 0);

const toHistoryStock = (answer: RaceAnswer) =>
  answer === "in" ? true : answer === "out" ? false : null;

const answerRace = async (
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

  const outcome = await doTransaction(async (m) => {
    const race = await m.findOne(RaceEntity, {
      where: { id: raceId, household: { id: householdId } },
    });
    if (!race) throw Missing(`Race ${raceId} not found`);
    if (!race.foodIds.includes(foodId)) throw UserError(400, "race.notInRace");

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
    if (run.finishedAt) throw UserError(409, "race.finished");

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

export default answerRace;
