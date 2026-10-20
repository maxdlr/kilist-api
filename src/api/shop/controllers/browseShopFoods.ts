import findAllFoods from "@/api/foods/services/findAllFoods";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { And, In, IsNull, LessThan, Not, Or } from "typeorm";
import findSession from "../services/findSession";
import updateSession from "../services/updateSession";
import { SessionStatus } from "@/entities/SessionEntity";

const browseShopFoods = async ({ query }: Request, res: Response) => {
  const sessionId = Number(query.sessionId);

  if (!query.sessionId || Number.isNaN(sessionId)) {
    throw ApiError("A valid sessionId is required");
  }

  try {
    const foods = await doTransaction(async (m) => {
      let session = await findSession({ id: sessionId }, m);

      if (!session) {
        throw Missing(`Session with id ${sessionId} not found`);
      }

      if (session.startFoods.length === 0) {
        throw ApiError("No start foods available for this session");
      }

      if (session.startFoods.length === session.boughtFoods.length) {
        session = await updateSession(
          {
            id: sessionId,
            status: SessionStatus.COMPLETED,
            endedAt: new Date(),
          },
          m,
        );

        return [];
      }

      const foods = await findAllFoods(
        {
          where: {
            id: And(
              In(session.startFoods as number[]),
              Not(In(session.boughtFoods as number[])),
            ),
            snoozedUntil: Or(IsNull(), LessThan(new Date())),
          },
        },
        m,
      );

      return foods;
    });

    return res.status(200).send(foods);
  } catch (error: any) {
    throw ApiError(500, error?.message);
  }
};

export default browseShopFoods;
