import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const findFoodSwipes = async (
  { take }: { take: number },
  manager?: EntityManager,
) => {
  const m = findManager(FoodRepository, manager);

  const foodIdsQuery = await m
    .createQueryBuilder(FoodEntity, "food")
    .select("food.id")
    .orderBy("food.inStockScore", "DESC")
    .take(take)
    .getMany();

  const foodIds = foodIdsQuery.map((food) => food.id);
  if (foodIds.length === 0) return [];

  const foodSwipes = await m
    .createQueryBuilder(FoodEntity, "food")
    .leftJoinAndSelect("food.foodHistories", "foodHistory")
    .where("food.id IN (:...foodIds)", { foodIds })
    .orderBy("food.inStockScore", "DESC")
    .addOrderBy("foodHistory.createdAt", "ASC")
    .getMany();

  return foodSwipes;
};
export default findFoodSwipes;
