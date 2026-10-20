import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const snoozeFood = async (
  food: FoodEntity,
  manager?: EntityManager,
  hours = 24,
) => {
  const m = findManager(FoodRepository, manager);

  // Snooze for 24 hours
  food.snoozedUntil = new Date(Date.now() + hours * 3600000);

  return await m.save(food);
};
export default snoozeFood;
