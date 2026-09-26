import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindManyOptions } from "typeorm";

const findAllFoods = async (
  options?: FindManyOptions<FoodEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(FoodRepository, manager);

  const foods = await m.find(FoodEntity, {
    order: { inStockScore: "ASC" },
    loadRelationIds: { relations: ["lists"] },
    ...options,
  });

  return foods;
};

export default findAllFoods;
