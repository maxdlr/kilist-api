import findAllFoods from "@/api/foods/services/findAllFoods";
import findAllShopLists from "@/api/shop-list/services/findAllShopLists";
import findAllSwipeLists from "@/api/swipe-list/services/findAllSwipeLists";
import { EntityManager, IsNull, Not } from "typeorm";
import { classifyFoodsByScore } from "./classifyFoodsByScore";

export interface Dashboard {
  foods: {
    total: number;
    scoreSummary: Record<0 | 0.25 | 0.5 | 0.75 | 1, number>;
  };
  shopLists: {
    latest: {
      date: Date;
      bought: number;
      snoozed: number;
    };
    total: number;
  };
  swipes: {
    latest: {
      date: Date;
      swiped: number;
    };
    total: number;
  };
}

const buildDashboard = async (
  householdId: number,
  manager?: EntityManager,
): Promise<Dashboard> => {
  const foods = await findAllFoods(
    { where: { household: { id: householdId } } },
    manager,
  );

  const foodsByScore = Object.fromEntries(
    Object.entries(classifyFoodsByScore(foods)).map(([score, foods]) => [
      Number(score),
      foods.length,
    ]),
  ) as Dashboard["foods"]["scoreSummary"];

  const shopLists =
    (await findAllShopLists(
      {
        order: { endedAt: "DESC" },
        where: { household: { id: householdId }, endedAt: Not(IsNull()) },
      },
      manager,
    )) || [];

  const swipeLists =
    (await findAllSwipeLists(
      {
        loadRelationIds: { relations: ["inStockFoods", "outOfStockFoods"] },
        order: { endedAt: "DESC" },
        where: { household: { id: householdId }, endedAt: Not(IsNull()) },
      },
      manager,
    )) || [];

  const now = new Date();

  const doneShopLists = shopLists.filter(
    (shopList) => shopList.boughtFoods.length > 0,
  );
  const latestShopList = doneShopLists[0];
  const latestBoughtIds = (latestShopList?.boughtFoods ?? []) as number[];
  const latestStartIds = (latestShopList?.startFoods ?? []) as number[];
  const latestSnoozedCount = foods.filter(
    (food) =>
      latestStartIds.includes(food.id) &&
      !latestBoughtIds.includes(food.id) &&
      food.snoozedUntil > now,
  ).length;

  const latestSwipeList = swipeLists[0];
  const latestSwipedCount = latestSwipeList
    ? (latestSwipeList.inStockFoods as number[]).length +
      (latestSwipeList.outOfStockFoods as number[]).length
    : 0;

  return {
    foods: {
      total: foods.length,
      scoreSummary: foodsByScore,
    },
    shopLists: {
      latest: {
        date: latestShopList?.endedAt as Date,
        bought: latestBoughtIds.length,
        snoozed: latestSnoozedCount,
      },
      total: doneShopLists.length,
    },
    swipes: {
      latest: {
        date: latestSwipeList?.endedAt as Date,
        swiped: latestSwipedCount,
      },
      total: swipeLists.length,
    },
  };
};

export default buildDashboard;
