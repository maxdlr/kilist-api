import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { parseTzOffset } from "@/helpers/localDay";
import getSwipeGame from "../services/getSwipeGame";
import recordSwipeSession from "../services/recordSwipeSession";

const completeSwipeList = async ({ body, user }: Request, res: Response) => {
  const householdId = user!.household.id;
  const userId = user!.id;
  const tzOffset = parseTzOffset(body?.tzOffset);

  const game = await doTransaction(async (m) => {
    const current = await getSwipeGame(userId, householdId, tzOffset, m);
    if (current.playedToday) return current;

    await recordSwipeSession(householdId, userId, m);
    return getSwipeGame(userId, householdId, tzOffset, m);
  });

  return res.status(201).json(game);
};

export default completeSwipeList;
