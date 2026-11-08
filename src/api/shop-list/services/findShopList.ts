import FoodEntity from "@/entities/FoodEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere, In, IsNull, Not } from "typeorm";

const findShopList = async (
  where: FindOptionsWhere<ShopListEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(ShopListRepository, manager);

  const shopList = await m.findOne(ShopListEntity, {
    where,
    relations: ["boughtFoods", "startFoods"],
  });

  if (!shopList) return shopList;

  const startFoods = shopList.startFoods as FoodEntity[];
  const boughtIds = new Set((shopList.boughtFoods as FoodEntity[]).map((food) => food.id));
  const stillListed = await m.find(FoodEntity, {
    where: { id: In(startFoods.map((food) => food.id)), lists: { id: Not(IsNull()) } },
    select: { id: true },
  });
  const listedIds = new Set(stillListed.map((food) => food.id));
  shopList.startFoods = startFoods.filter((food) => listedIds.has(food.id) || boughtIds.has(food.id));

  return shopList;
};
export default findShopList;
