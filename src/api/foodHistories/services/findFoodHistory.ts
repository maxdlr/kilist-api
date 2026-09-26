import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";

const findFoodHistory = async (
  where: FindOptionsWhere<FoodHistoryEntity>,
  manager?: EntityManager,
): Promise<FoodHistoryEntity | null> => {
  const m = findManager(FoodHistoryRepository, manager);

  const food = await m.findOne(FoodHistoryEntity, { where });
  return food;
};

export default findFoodHistory;
