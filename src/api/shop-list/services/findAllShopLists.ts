import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindManyOptions } from "typeorm";

const findAllShopLists = async (
  options: FindManyOptions<ShopListEntity> = {},
  manager?: EntityManager,
) => {
  const m = findManager(ShopListRepository, manager);

  const shopList = await m.find(ShopListEntity, {
    loadRelationIds: { relations: ["boughtFoods", "startFoods"] },
    order: { createdAt: "ASC" },
    ...options,
  });

  return shopList;
};
export default findAllShopLists;
