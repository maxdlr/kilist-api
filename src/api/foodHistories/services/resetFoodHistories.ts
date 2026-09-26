import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const resetFoodHistories = async (foodId: number, manager?: EntityManager) => {
  const m = findManager(FoodRepository, manager);
  await m.delete(FoodHistoryEntity, { food: { id: foodId } });
};

export default resetFoodHistories;
