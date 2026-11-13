import { RULES } from "@/api/catalog/rules";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager, IsNull, Not } from "typeorm";
import { waitDaysFor } from "../helpers";
import findAllFoods from "./findAllFoods";

const SWIPE_BELOW = RULES.swipe.eligibleBelow;

const findFoodSwipes = async (
  householdId: number,
  { take }: { take: number },
  manager?: EntityManager,
) => {
  const m = findManager(FoodRepository, manager);

  // take is intentionally not passed to the query here: TypeORM applies
  // LIMIT to the joined (food x foodHistories) row count, not the number of
  // distinct foods, so a food with several histories can "use up" more of
  // the limit than a single row — silently returning fewer than `take`
  // distinct foods once enough history accumulates. Slice in JS instead,
  // after the recency filter below, to guarantee distinct-food semantics.
  const foods = await findAllFoods(
    {
      loadRelationIds: false,

      relations: { foodHistories: true },

      where: {
        household: { id: householdId },
        lists: { id: Not(IsNull()) },
      },

      order: { inStockScore: "DESC" },
    },
    m,
  );

  const eligibleFoods = foods.filter((food) => {
    const foodHistories = food.foodHistories;

    if (!foodHistories || foodHistories.length === 0) {
      return true;
    }

    // Array order from the DB isn't guaranteed to be chronological, so find
    // the latest history explicitly rather than assuming the last element is.
    const latestFoodHistory = foodHistories.reduce((latest, current) =>
      (current.createdAt?.getTime() ?? 0) > (latest.createdAt?.getTime() ?? 0)
        ? current
        : latest,
    );

    if (!latestFoodHistory?.createdAt) {
      return true;
    }

    return latestFoodHistory.createdAt < new Date(Date.now() - RULES.swipe.restHours * 3600000);
  });

  const lastActivity = (food: (typeof foods)[number]) =>
    Math.max(
      food.lastBoughtAt?.getTime() ?? 0,
      ...(food.foodHistories ?? []).map((history) => history.createdAt?.getTime() ?? 0),
    );
  const now = Date.now();
  const isStale = (food: (typeof foods)[number]) =>
    lastActivity(food) < now - waitDaysFor(food) * 24 * 3600000;
  const low = eligibleFoods.filter((food) => food.inStockScore < SWIPE_BELOW);
  const stale = eligibleFoods
    .filter((food) => food.inStockScore >= SWIPE_BELOW && isStale(food))
    .sort((a, b) => lastActivity(a) - lastActivity(b));

  return [...low, ...stale].slice(0, take);
};

export default findFoodSwipes;
