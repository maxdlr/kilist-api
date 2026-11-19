import { scoreFood, type CycleFood } from "@/api/foods/scoring";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";

const calculateInStockScore = (histories: FoodHistoryEntity[], food: CycleFood = {}) =>
  scoreFood(
    food,
    histories.map((history) => ({ isInStock: history.isInStock, at: history.createdAt ?? new Date() })),
  );

export default calculateInStockScore;
