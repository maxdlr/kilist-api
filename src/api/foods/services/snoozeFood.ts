import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import findFood from "./findFood";
import FoodEntity from "@/entities/FoodEntity";

const snoozeFood = async (foodId: number, manager?: EntityManager) => {
  const m = findManager(FoodRepository, manager);

  const food = await findFood({ id: foodId }, m);

  if (!food) {
    throw ApiError(`Food with id ${foodId} not found`);
  }

  food.snoozed = true;

  await m.save(FoodEntity, food);
};
export default snoozeFood;
