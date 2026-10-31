import SwipeListEntity from "@/entities/SwipeListEntity";
import SwipeListRepository from "@/repositories/SwipeListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindManyOptions } from "typeorm";

const findAllSwipeLists = async (
  options: FindManyOptions<SwipeListEntity> = {},
  manager?: EntityManager,
) => {
  const m = findManager(SwipeListRepository, manager);

  const swipeList = await m.find(SwipeListEntity, {
    loadRelationIds: { relations: ["boughtFoods", "startFoods"] },
    order: { createdAt: "ASC" },
    ...options,
  });

  return swipeList;
};
export default findAllSwipeLists;
