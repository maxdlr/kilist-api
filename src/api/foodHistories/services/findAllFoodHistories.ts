import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindManyOptions } from "typeorm";

const findAllFoodHistories = async (
  options: FindManyOptions<FoodHistoryEntity>,
  manager?: EntityManager,
): Promise<FoodHistoryEntity[]> => {
  const m = findManager(FoodHistoryRepository, manager);

  const findAllFoodHistories = await m.find(FoodHistoryEntity, {
    ...options,
  });

  return findAllFoodHistories;
};
export default findAllFoodHistories;
