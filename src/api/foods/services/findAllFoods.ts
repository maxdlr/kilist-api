import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import { FindManyOptions } from "typeorm";

const findAllFoods = async (options?: FindManyOptions<FoodEntity>) => {
  const foods = await FoodRepository.find({
    order: { inStockScore: "ASC" },
    loadRelationIds: { relations: ["lists"] },
    ...options,
  });
  return foods;
};

export default findAllFoods;
