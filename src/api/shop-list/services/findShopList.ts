import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";

const findShopList = async (
  where: FindOptionsWhere<ShopListEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(ShopListRepository, manager);

  const shopList = await m.findOne(ShopListEntity, {
    where,
    relations: ["boughtFoods", "startFoods"],
  });

  return shopList;
};
export default findShopList;
