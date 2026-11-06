import updateFoodInStockScore from "@/api/foods/services/updateFoodInStockScore";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const createFoodHistory = async (
  {
    foodId,
    isInStock,
    userId,
  }: {
    foodId: number;
    isInStock: boolean | null;
    userId?: number;
  },
  manager?: EntityManager,
): Promise<void> => {
  const m = findManager(FoodHistoryRepository, manager);

  await m.save(FoodHistoryEntity, {
    food: { id: foodId },
    isInStock: isInStock,
    user: userId ? { id: userId } : null,
  });

  await updateFoodInStockScore(foodId, m);
};

export default createFoodHistory;
