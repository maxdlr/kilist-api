import findAllFoods from "@/api/foods/services/findAllFoods";
import findAllShopLists from "@/api/shop-list/services/findAllShopLists";
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

const getDashboard = async (_req: Request, res: Response) => {
  const dashboard: Dashboard = await doTransaction(async (m) => {
    const foods = await findAllFoods({}, m);

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
          where: { endedAt: Not(IsNull()) },
        },
        m,
      )) || [];

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
    };
  });

  return res.status(200).send(dashboard);
};
export default getDashboard;
