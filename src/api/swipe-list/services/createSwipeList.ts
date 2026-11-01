import findFoodSwipes from "@/api/foods/services/findFoodSwipes";
import SwipeListEntity from "@/entities/SwipeListEntity";
import SwipeListRepository from "@/repositories/SwipeListRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const createSwipeList = async (
  householdId: number,
  manager?: EntityManager,
) => {
  const m = findManager(SwipeListRepository, manager);

  const startFoods = await findFoodSwipes(
    householdId,
    {
      take: 10,
    },
    m,
  );

  const swipeList = new SwipeListEntity();

  swipeList.startFoods = startFoods;
  swipeList.household = { id: householdId } as SwipeListEntity["household"];

  const createdSwipeList = await m.save(SwipeListEntity, swipeList);

  return createdSwipeList;
};
export default createSwipeList;
