import FoodEntity from "@/entities/FoodEntity";
import FrequencyEntity from "@/entities/FrequencyEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const createFrequency = async (
  foods: {
    food: FoodEntity;
    nextCheckFood: FoodEntity;
  },
  manager?: EntityManager,
) => {
  const m = findManager(FrequencyRepository, manager);

  const createdFrequency = await m.save(FrequencyEntity, {
    food: foods.food,
    nextCheckFood: foods.nextCheckFood,
  });

  return createdFrequency;
};
export default createFrequency;
