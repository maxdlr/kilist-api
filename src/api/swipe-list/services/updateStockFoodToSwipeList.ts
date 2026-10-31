import FoodEntity from "@/entities/FoodEntity";
import SwipeListEntity from "@/entities/SwipeListEntity";
import SwipeListRepository from "@/repositories/SwipeListRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import findSwipeList from "./findSwipeList";
import updateSwipeList from "./updateSwipeList";

const updateStockFoodToSwipeList = async (
  swipeList: SwipeListEntity | number,
  foodId: number,
  stockToUpdate: "inStockFoods" | "outOfStockFoods" = "inStockFoods",
  manager?: EntityManager,
) => {
  const m = findManager(SwipeListRepository, manager);

  console.log({ stockToUpdate });

  if (typeof swipeList === "number") {
    swipeList = (await findSwipeList(
      { where: { id: swipeList } },
      m,
    )) as SwipeListEntity;
  }

  if (!swipeList) {
    throw Missing(`SwipeList with id ${swipeList} not found`);
  }

  const foods: Partial<FoodEntity>[] = [
    ...(swipeList[stockToUpdate].map((fId) => ({
      id: fId,
    })) as Partial<FoodEntity>[]),
    { id: foodId },
  ];

  return await updateSwipeList({ ...swipeList, [stockToUpdate]: foods }, m);
};
export default updateStockFoodToSwipeList;
