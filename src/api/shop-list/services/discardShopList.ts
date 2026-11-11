import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const discardShopList = async (id: number, manager?: EntityManager) => {
  const m = findManager(ShopListRepository, manager);
  const shopList = await m.findOne(ShopListEntity, { where: { id } });
  if (shopList) await m.remove(ShopListEntity, shopList);
};

export default discardShopList;
