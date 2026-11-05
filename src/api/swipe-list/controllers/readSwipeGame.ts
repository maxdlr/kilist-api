import { Request, Response } from "express";
import getSwipeGame, { parseTzOffset } from "../services/getSwipeGame";

const readSwipeGame = async ({ query, user }: Request, res: Response) => {
  const game = await getSwipeGame(
    user!.household.id,
    parseTzOffset(query.tzOffset),
  );

  return res.status(200).json(game);
};

export default readSwipeGame;
