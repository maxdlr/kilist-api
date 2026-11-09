import ShopListEntity, { ShopListStatus } from "@/entities/ShopListEntity";
import { EntityManager, IsNull, MoreThan, Or } from "typeorm";
import createShopList from "./createShopList";
import findShopList from "./findShopList";
import updateShopList from "./updateShopList";

const openShopList = async (
  householdId: number,
  userId: number,
  m: EntityManager,
  options: { extraFoodIds?: number[]; at?: Date } = {},
): Promise<number | null> => {
  const existingOpenShopList: ShopListEntity | null = await findShopList(
    {
      household: { id: householdId },
      endedAt: Or(IsNull(), MoreThan(new Date())),
    },
    m,
  );

  if (existingOpenShopList && existingOpenShopList.startFoods.length > 0) {
    return existingOpenShopList.id;
  }

  if (existingOpenShopList) {
    await updateShopList(
      {
        id: existingOpenShopList.id,
        status: ShopListStatus.COMPLETED,
        endedAt: new Date(),
      },
      m,
    );
  }

  const shopList = await createShopList(householdId, m, userId, options);

  return shopList?.id ?? null;
};

export default openShopList;
