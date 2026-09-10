import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import calculateInStockScore from "./calculateInStockScore";
import FoodRepository from "@/repositories/FoodRepository";
import { FoodHistoryCreateType } from "../interfaces";

const createFoodHistory = async (
  foodHistoryCreate: FoodHistoryCreateType[],
): Promise<void> => {
  const inStockScoreInsertPromises = foodHistoryCreate.map(async (item) => {
    await FoodHistoryRepository.save({
      food: { id: item.foodId },
      isInStock: item.isInStock,
    });

    const itemInStockScores = await FoodHistoryRepository.find({
      where: { food: { id: item.foodId } },
    });

    const newInStockScore = calculateInStockScore(itemInStockScores);

    const food = await FoodRepository.findOne({ where: { id: item.foodId } });

    if (!food) {
      throw ServiceError(`Food with id ${item.foodId} not found`);
    }

    food.inStockScore = newInStockScore;
    await FoodRepository.save(food);
  });

  try {
    await Promise.all(inStockScoreInsertPromises);
  } catch (e) {
    throw ServiceError(`Failed to process update: ${e}`);
  }
};

export default createFoodHistory;
