import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import { FindManyOptions } from "typeorm";

const findAllFoodHistories = async (
  options: FindManyOptions<FoodHistoryEntity>,
): Promise<FoodHistoryEntity[]> => {
  const findAllFoodHistories = await FoodHistoryRepository.find({
    ...options,
  });
  return findAllFoodHistories;
};
export default findAllFoodHistories;
