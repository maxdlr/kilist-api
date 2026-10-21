import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const updateShopList = async (
  shopList: Partial<ShopListEntity>,
  manager?: EntityManager,
) => {
  if (!shopList.id) {
    throw Missing("ShopList id is required to update a shopList");
  }

  const m = findManager(ShopListRepository, manager);

  const updatedShopList = await m.save(ShopListEntity, shopList);

  return updatedShopList;
};
export default updateShopList;
