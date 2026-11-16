import createFoodHistory from "@/api/foodHistories/services/createFoodHistory";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import { EntityManager, LessThanOrEqual } from "typeorm";
import findFood from "./findFood";

export const LEVEL_STEPS = 4;

const setFoodLevel = async (
  { userId, householdId, foodId, level, at }: {
    userId: number;
    householdId: number;
    foodId: number;
    level: unknown;
    at: Date;
  },
  m: EntityManager,
): Promise<void> => {
  const inStock = Number(level) * LEVEL_STEPS;
  if (!Number.isInteger(inStock) || inStock < 0 || inStock > LEVEL_STEPS) {
    throw ApiError("level must be 0, 0.25, 0.5, 0.75 or 1");
  }

  const food = await findFood({ id: foodId, household: { id: householdId } }, m);
  if (!food) throw Missing(`Food with id ${foodId} not found`);
  if (food.lastBoughtAt && at < food.lastBoughtAt) return;

  await m.delete(FoodHistoryEntity, { food: { id: foodId }, createdAt: LessThanOrEqual(at) });
  for (let step = 0; step < LEVEL_STEPS; step++) {
    await createFoodHistory({ foodId, isInStock: step < inStock, userId, at }, m);
  }
};

export default setFoodLevel;
