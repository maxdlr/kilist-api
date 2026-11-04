import findAllFoods from "@/api/foods/services/findAllFoods";
import findAllShopLists from "@/api/shop-list/services/findAllShopLists";
import findAllSwipeLists from "@/api/swipe-list/services/findAllSwipeLists";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { IsNull, Not } from "typeorm";
import { classifyFoodsByScore } from "../services/classifyFoodsByScore";

interface Dashboard {
  foods: {
    total: number;
    scoreSummary: Record<1 | 2 | 3 | 4 | 5, number>;
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

const getDashboard = async (req: Request, res: Response) => {
  const householdId = req.user!.household.id;

  const dashboard: Dashboard = await doTransaction(async (m) => {
    const foods = await findAllFoods(
      { where: { household: { id: householdId } } },
      m,
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
        m,
      )) || [];

    const swipeLists =
      (await findAllSwipeLists(
        {
          loadRelationIds: { relations: ["inStockFoods", "outOfStockFoods"] },
          order: { endedAt: "DESC" },
          where: { household: { id: householdId }, endedAt: Not(IsNull()) },
        },
        m,
      )) || [];

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
          date: shopLists[0]?.endedAt as Date,
          bought: shopLists[0]?.boughtFoods?.length || 0,
          snoozed: shopLists[0]?.startFoods?.length || 0,
        },
        total: shopLists.length,
      },
      swipes: {
        latest: {
          date: latestSwipeList?.endedAt as Date,
          swiped: latestSwipedCount,
        },
        total: swipeLists.length,
      },
    };
  });

  return res.status(200).send(dashboard);
};
export default getDashboard;
