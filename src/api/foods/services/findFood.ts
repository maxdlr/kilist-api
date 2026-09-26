import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";

const findFood = async (
  where: FindOptionsWhere<FoodEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(FoodRepository, manager);
  const food = await m.findOne(FoodEntity, { where });
  return food;
};

export default findFood;
