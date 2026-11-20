import { RULES } from "@/api/catalog/rules";
import FoodEntity from "@/entities/FoodEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import ShopListRepository from "@/repositories/ShopListRepository";
import findManager from "@/utils/findManager";
import { EntityManager, IsNull } from "typeorm";

const joinOpenShopList = async (householdId: number, foodId: number, manager?: EntityManager) => {
  const m = findManager(ShopListRepository, manager);

  const open = await m.findOne(ShopListEntity, {
    where: { household: { id: householdId }, endedAt: IsNull() },
    relations: ["startFoods"],
  });
  if (!open || (open.startFoods as FoodEntity[]).some((food) => food.id === foodId)) return false;

  const food = await m.findOne(FoodEntity, {
    where: { id: foodId, household: { id: householdId } },
    relations: ["lists"],
  });
  const snoozed = food?.snoozedUntil && food.snoozedUntil.getTime() > Date.now();
  if (!food || food.lists.length === 0 || snoozed || food.inStockScore >= RULES.shop.buyBelow) return false;

  await m.createQueryBuilder().relation(ShopListEntity, "startFoods").of(open.id).add(foodId);
  return true;
};

export default joinOpenShopList;
