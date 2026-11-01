import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager, LessThan } from "typeorm";
import findAllFoods from "./findAllFoods";

const findFoodSwipes = async (
  householdId: number,
  { take }: { take: number },
  manager?: EntityManager,
) => {
  const m = findManager(FoodRepository, manager);

  const foods = await findAllFoods(
    {
      loadRelationIds: false,

      relations: { foodHistories: true },

      where: {
        household: { id: householdId },
        inStockScore: LessThan(0.75),
      },

      order: { inStockScore: "DESC" },

      take,
    },
    m,
  );

  return foods.filter((food) => {
    const foodHistories = food.foodHistories;
    const latestFoodHistory = foodHistories?.[foodHistories.length - 1];

    if (foodHistories.length === 0 || !latestFoodHistory?.createdAt) {
      return true;
    }

    return latestFoodHistory.createdAt < new Date(Date.now() - 24 * 360000);
  });
};

export default findFoodSwipes;
