import InStockScoreRepository from "@/repositories/InStockScoreRepository";
import { StockUpdate } from "../interfaces";
import calculateInStockScore from "./calculateInStockScore";
import FoodRepository from "@/repositories/FoodRepository";

const processStockUpdate = async (update: StockUpdate[]): Promise<void> => {
  const inStockScoreInsertPromises = update.map(async (item) => {
    await InStockScoreRepository.save({
      food: { id: item.foodId },
      isInStock: item.isInStock,
    });

    const itemInStockScores = await InStockScoreRepository.find({
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

export default processStockUpdate;
