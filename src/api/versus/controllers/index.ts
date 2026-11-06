import { parseTzOffset } from "@/api/swipe-list/services/getSwipeGame";
import { Request, Response } from "express";
import { answerRace, raceView } from "../services/race";
import { houseVotes, shopRecords, shopTip } from "../services/shop";
import { meStats, standings } from "../services/stats";

const idParam = (value: unknown, name: string) => {
  const id = Number(value);
  if (!Number.isInteger(id)) throw ApiError(`A valid ${name} is required`);
  return id;
};

export const readRace = async ({ query, user }: Request, res: Response) =>
  res.status(200).json(await raceView(user!, parseTzOffset(query.tzOffset)));

export const answerRaceFood = async ({ body, params, user }: Request, res: Response) =>
  res.status(200).json(
    await answerRace(user!, idParam(params.id, "race id"), {
      foodId: body?.foodId,
      answer: body?.answer,
      ms: body?.ms,
    }),
  );

export const readStandings = async ({ query, user }: Request, res: Response) =>
  res
    .status(200)
    .json(
      await standings(
        user!,
        parseTzOffset(query.tzOffset),
        query.period === "season" ? "season" : "week",
      ),
    );

export const readMe = async ({ query, user }: Request, res: Response) =>
  res.status(200).json(await meStats(user!, parseTzOffset(query.tzOffset)));

export const readShop = async ({ user }: Request, res: Response) =>
  res.status(200).json(await shopRecords(user!));

export const readShopTip = async ({ params, query, user }: Request, res: Response) =>
  res
    .status(200)
    .json(await shopTip(user!, idParam(params.id, "shop list id"), idParam(query.after, "food id")));

export const readVotes = async ({ user }: Request, res: Response) =>
  res.status(200).json(await houseVotes(user!));
