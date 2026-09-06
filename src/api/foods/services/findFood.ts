import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import { FindOptionsWhere } from "typeorm";

const findFood = async (where: FindOptionsWhere<FoodEntity>) => {
  const food = await FoodRepository.findOne({ where });
  return food;
};

export default findFood;
