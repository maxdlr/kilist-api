import updateFoodInStockScore from "@/api/foods/services/updateFoodInStockScore";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const createFoodHistory = async (
  {
    foodId,
    isInStock,
    userId,
    at,
  }: {
    foodId: number;
    isInStock: boolean | null;
    userId?: number;
    at?: Date;
  },
  manager?: EntityManager,
): Promise<void> => {
  const m = findManager(FoodHistoryRepository, manager);

  if (at) {
    const food = await m.findOne(FoodEntity, {
      where: { id: foodId },
      select: { id: true, lastBoughtAt: true },
    });
    if (food?.lastBoughtAt && at < food.lastBoughtAt) return;
  }

  await m.save(FoodHistoryEntity, {
    food: { id: foodId },
    isInStock: isInStock,
    user: userId ? { id: userId } : null,
    ...(at && { createdAt: at }),
  });

  await updateFoodInStockScore(foodId, m);
};

export default createFoodHistory;
