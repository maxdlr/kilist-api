import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import findAllFoodHistories from "./findAllFoodHistories";
import removeFoodHistories from "./removeFoodHistories";

const LIMIT = 8;

const limitFoodHistories = async (foodId: number, manager?: EntityManager) => {
  const m = findManager(FoodHistoryRepository, manager);

  const allFoodHistories = await findAllFoodHistories(
    {
      where: { food: { id: foodId } },
      order: { createdAt: "ASC", id: "ASC" },
    },
    m,
  );

  if (allFoodHistories.length > LIMIT) {
    const toTrimHistories = allFoodHistories.slice(
      0,
      allFoodHistories.length - LIMIT,
    );

    for (const h of toTrimHistories) {
      await removeFoodHistories({ id: h.id }, m);
    }
  }

  return "updateFoodHistories";
};
export default limitFoodHistories;
