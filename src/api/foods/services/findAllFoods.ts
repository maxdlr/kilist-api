import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import { FindOptionsWhere } from "typeorm";

const findAllFoods = async (where?: FindOptionsWhere<FoodEntity>) => {
  const foods = await FoodRepository.find({
    where,
    order: { inStockScore: "DESC" },
  });
  return foods;
};

export default findAllFoods;
