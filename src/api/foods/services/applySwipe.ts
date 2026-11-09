import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import awardSwipe from "@/api/prizes/services/awardSwipe";
import { EntityManager } from "typeorm";
import findFood from "./findFood";

const applySwipe = async (
  {
    userId,
    householdId,
    foodId,
    isInStock,
    at,
    withReward,
  }: {
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

  await createFoodHistory({ foodId, isInStock, userId, at }, m);
  if (withReward) {
    await awardSwipe(userId, foodId, m, at);
  }
};

export default applySwipe;
