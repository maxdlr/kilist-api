import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";
import findFoodHistory from "./findFoodHistory";

const removeFoodHistories = async (
  where: FindOptionsWhere<FoodHistoryEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(FrequencyRepository, manager);

  const foundFoodHistory = await findFoodHistory(where, m);

  if (!foundFoodHistory) {
    throw ServiceError("Frequency not found");
  }

  await m.delete(FoodHistoryEntity, foundFoodHistory.id);
};
export default removeFoodHistories;
