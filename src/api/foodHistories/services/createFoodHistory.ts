import updateFoodInStockScore from "@/api/foods/services/updateFoodInStockScore";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const createFoodHistory = async (
  {
    foodId,
    isInStock,
  }: {
    foodId: number;
    isInStock: boolean;
  },
  manager?: EntityManager,
): Promise<void> => {
  const m = findManager(FoodHistoryRepository, manager);

  await m.save(FoodHistoryEntity, {
    food: { id: foodId },
    isInStock: isInStock,
  });

  await updateFoodInStockScore(foodId, m);
};

export default createFoodHistory;
