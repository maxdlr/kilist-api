import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import findAllFoodHistories from "./findAllFoodHistories";
import updateFoodInStockScore from "@/api/foods/services/updateFoodInStockScore";

const resetFoodHistories = async (foodId: number, manager?: EntityManager) => {
  const m = findManager(FoodHistoryRepository, manager);

  const foodHistories = await findAllFoodHistories(
    {
      where: { food: { id: foodId } },
    },
    m,
  );

  for (const foodHistory of foodHistories) {
    await m.delete(FoodHistoryEntity, foodHistory.id);
  }

  await updateFoodInStockScore(foodId, m);
};

export default resetFoodHistories;
