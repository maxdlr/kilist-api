import FoodEntity from "@/entities/FoodEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, IsNull, Not } from "typeorm";

const shopRuns = async (householdId: number, manager?: EntityManager) => {
  const lists = await findManager(ShopListRepository, manager).find(ShopListEntity, {
    where: { household: { id: householdId }, endedAt: Not(IsNull()), user: Not(IsNull()) },
    relations: { user: true, boughtFoods: true },
    order: { id: "ASC" },
  });

  return lists
    .filter((list) => (list.boughtFoods as FoodEntity[]).length > 0 && list.createdAt && list.endedAt)
    .map((list) => {
      const start = list.createdAt!.getTime();
      return {
        id: list.id,
        userId: list.user!.id,
        username: list.user!.username,
        ms: Math.max(0, list.endedAt!.getTime() - start),
        items: (list.boughtFoods as FoodEntity[]).length,
        foodIds: (list.boughtFoods as FoodEntity[]).map((food) => food.id),
        splits: (list.buyLog ?? [])
          .map((entry) => Date.parse(entry.at) - start)
          .filter((split) => split >= 0)
          .sort((a, b) => a - b),
        endedAt: list.endedAt!,
      };
    });
};

export default shopRuns;
