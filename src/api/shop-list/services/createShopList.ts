import findAllFoods from "@/api/foods/services/findAllFoods";
import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, IsNull, LessThan, Or } from "typeorm";

const createShopList = async (manager?: EntityManager) => {
  const m = findManager(ShopListRepository, manager);

  const foods = await findAllFoods(
    {
      where: {
        inStockScore: LessThan(1),
        snoozedUntil: Or(IsNull(), LessThan(new Date())),
      },
    },
    m,
  );

  const shopList = new ShopListEntity();

  shopList.startFoods = foods;

  const createdShopList = await m.save(ShopListEntity, shopList);

  return createdShopList;
};
export default createShopList;
