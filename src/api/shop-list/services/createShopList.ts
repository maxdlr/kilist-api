import findAllFoods from "@/api/foods/services/findAllFoods";
import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, IsNull, LessThan, Or } from "typeorm";

const createShopList = async (householdId: number, manager?: EntityManager) => {
  const m = findManager(ShopListRepository, manager);

  const foods = await findAllFoods(
    {
      where: {
        household: { id: householdId },
        inStockScore: LessThan(1),
        snoozedUntil: Or(IsNull(), LessThan(new Date())),
      },
    },
    m,
  );

  if (foods.length === 0) {
    return null;
  }

  const shopList = new ShopListEntity();

  shopList.startFoods = foods;
  shopList.household = { id: householdId } as ShopListEntity["household"];

  const createdShopList = await m.save(ShopListEntity, shopList);

  return createdShopList;
};
export default createShopList;
