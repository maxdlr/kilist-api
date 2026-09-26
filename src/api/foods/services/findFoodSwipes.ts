import FoodRepository from "@/repositories/FoodRepository";

const findFoodSwipes = async ({ take }: { take: number }) => {
  const foodIdsQuery = await FoodRepository.createQueryBuilder("food")
    .select("food.id")
    .orderBy("food.inStockScore", "DESC")
    .take(take)
    .getMany();

  const foodIds = foodIdsQuery.map((food) => food.id);
  if (foodIds.length === 0) return [];

  const foodSwipes = await FoodRepository.createQueryBuilder("food")
    .leftJoinAndSelect("food.foodHistories", "foodHistory")
    .where("food.id IN (:...foodIds)", { foodIds })
    .orderBy("food.inStockScore", "DESC")
    .addOrderBy("foodHistory.createdAt", "ASC")
    .getMany();

  return foodSwipes;
};
export default findFoodSwipes;
