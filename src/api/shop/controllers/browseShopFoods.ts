import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { LessThan } from "typeorm";
import findSession from "../services/findSession";
import findAllFoods from "@/api/foods/services/findAllFoods";
import updateSession from "../services/updateSession";

const browseShopFoods = async ({ query }: Request, res: Response) => {
  const sessionId = Number(query.sessionId);

  if (!query.sessionId || Number.isNaN(sessionId)) {
    throw ApiError("A valid sessionId is required");
  }

  try {
    const foods = await doTransaction(async (m) => {
      const session = await findSession({ id: sessionId }, m);

      if (!session) {
        throw Missing(`Session with id ${sessionId} not found`);
      }

      const foods = await findAllFoods(
        {
          where: {
            inStockScore: LessThan(1),
          },
        },
        m,
      );

      session.foods = foods;

      await updateSession(session, m);

      return foods;
    });

    return res.status(200).send(foods);
  } catch (error: any) {
    throw ApiError(500, error?.message);
  }
};

export default browseShopFoods;
