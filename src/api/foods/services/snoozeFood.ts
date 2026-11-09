import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const snoozeFood = async (
  food: FoodEntity,
  manager?: EntityManager,
  hours = 24,
  at: Date = new Date(),
) => {
  const m = findManager(FoodRepository, manager);

  const until = new Date(at.getTime() + hours * 3600000);
  if (!food.snoozedUntil || until > new Date(food.snoozedUntil)) {
    food.snoozedUntil = until;
  }

  return await m.save(food);
};
export default snoozeFood;
