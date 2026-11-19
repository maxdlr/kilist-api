import calculateInStockScore from "@/api/foodHistories/services/calculateInStockScore";
import findAllFoodHistories from "@/api/foodHistories/services/findAllFoodHistories";
import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import limitFoodHistories from "@/api/foodHistories/services/limitFoodHistories";

const updateFoodInStockScore = async (
  foodId: number,
  manager?: EntityManager,
) => {
  const m = findManager(FoodRepository, manager);

  await limitFoodHistories(foodId, m);

  // foodId is already validated against the caller's household at the
  // controller entry point (e.g. editFoods, editSwipeList) — no need to
  // re-scope this internal lookup.
  const food = await m.findOne(FoodEntity, { where: { id: foodId } });

  if (!food) {
    throw ServiceError(`Food with id ${foodId} not found`);
  }

  const histories = await findAllFoodHistories(
    { where: { food: { id: foodId } } },
    m,
  );

  food.inStockScore = calculateInStockScore(histories, food);

  await m.save(FoodEntity, food);
};

export default updateFoodInStockScore;
