import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const loadFood = async (id: number, manager?: EntityManager) => {
  const food = await findManager(FoodRepository, manager).findOne(FoodEntity, { where: { id }, relations: { household: true } });
  if (!food) throw Missing(`Food ${id} not found`);
  return food;
};

export default loadFood;
