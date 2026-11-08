import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import { parseTzOffset } from "@/helpers/localDay";
import getSwipeGame from "../services/getSwipeGame";
import recordSwipeSession from "../services/recordSwipeSession";

const completeSwipeList = async ({ body, user }: Request, res: Response) => {
  const householdId = user!.household.id;
  const tzOffset = parseTzOffset(body?.tzOffset);

  const game = await doTransaction(async (m) => {
    const current = await getSwipeGame(householdId, tzOffset, m);
    if (current.playedToday) return current;

    await recordSwipeSession(householdId, m);
    return getSwipeGame(householdId, tzOffset, m);
  });

  return res.status(201).json(game);
};

export default completeSwipeList;
