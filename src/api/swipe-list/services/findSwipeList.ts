import SwipeListEntity from "@/entities/SwipeListEntity";
import SwipeListRepository from "@/repositories/SwipeListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOneOptions } from "typeorm";

const findSwipeList = async (
  options?: FindOneOptions<SwipeListEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(SwipeListRepository, manager);
  const swipeList = await m.findOne(SwipeListEntity, {
    loadRelationIds: {
      relations: ["startFoods", "inStockFoods", "outOfStockFoods"],
    },
    ...options,
  });
  return swipeList;
};
export default findSwipeList;
