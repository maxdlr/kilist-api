import SwipeListEntity from "@/entities/SwipeListEntity";
import SwipeListRepository from "@/repositories/SwipeListRepository";
import findManager from "@/utils/findManager";
import { DeepPartial, EntityManager } from "typeorm";

const updateSwipeList = async (
  swipeList: DeepPartial<SwipeListEntity>,
  manager?: EntityManager,
) => {
  if (!swipeList.id) {
    throw Missing("SwipeList id is required to update a swipeList");
  }

  const m = findManager(SwipeListRepository, manager);

  const updatedSwipeList = await m.save(SwipeListEntity, swipeList);

  return updatedSwipeList;
};
export default updateSwipeList;
