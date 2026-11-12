import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import awardSwipe from "@/api/prizes/services/awardSwipe";
import { RULES } from "@/api/catalog/rules";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import { Between, EntityManager } from "typeorm";
import findFood from "./findFood";

const applySwipe = async (
  {
    userId,
    householdId,
    foodId,
    isInStock,
    at,
    withReward,
    replay = false,
  }: {
    replay?: boolean;
    userId: number;
    householdId: number;
    foodId: number;
    isInStock: boolean | null;
    at: Date;
    withReward: boolean;
  },
  m: EntityManager,
): Promise<void> => {
  if (isInStock !== true && isInStock !== false && isInStock !== null) {
    throw ApiError("isInStock must be true, false or null");
  }

  const food = await findFood({ id: foodId, household: { id: householdId } }, m);
  if (!food) {
    throw Missing(`Food with id ${foodId} not found`);
  }

  if (replay) {
    const since = new Date(at.getTime() - RULES.swipe.restHours * 3600000);
    await m.delete(FoodHistoryEntity, {
      food: { id: foodId },
      user: { id: userId },
      createdAt: Between(since, at),
    });
  }

  await createFoodHistory({ foodId, isInStock, userId, at }, m);
  if (withReward && !replay) {
    await awardSwipe(userId, foodId, m, at);
  }
};

export default applySwipe;
