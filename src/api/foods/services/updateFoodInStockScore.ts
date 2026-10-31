import calculateInStockScore from "@/api/foodHistories/services/calculateInStockScore";
import findAllFoodHistories from "@/api/foodHistories/services/findAllFoodHistories";
import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import findFood from "./findFood";
import limitFoodHistories from "@/api/foodHistories/services/limitFoodHistories";

const updateFoodInStockScore = async (
  foodId: number,
  manager?: EntityManager,
) => {
  const m = findManager(FoodRepository, manager);

  const foodInStockScores = await findAllFoodHistories(
    { where: { food: { id: foodId } } },
    m,
  );

  const newInStockScore = calculateInStockScore(foodInStockScores);

  const food = await findFood({ id: foodId }, m);

  if (!food) {
    throw ServiceError(`Food with id ${foodId} not found`);
  }

  food.inStockScore = newInStockScore;

  await m.save(FoodEntity, food);

  await limitFoodHistories(foodId, m);
};

export default updateFoodInStockScore;
