import ShopListEntity, { ShopListStatus } from "@/entities/ShopListEntity";
import { EntityManager } from "typeorm";
import updateShopList from "./updateShopList";

const closeShopListIfDone = async (
  shopList: ShopListEntity,
  at: Date,
  m: EntityManager,
): Promise<void> => {
  if (shopList.endedAt) return;
  if (shopList.boughtFoods.length < shopList.startFoods.length) return;

  await updateShopList(
    { id: shopList.id, status: ShopListStatus.COMPLETED, endedAt: at },
    m,
  );
};

export default closeShopListIfDone;
