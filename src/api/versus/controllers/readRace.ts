import { parseTzOffset } from "@/helpers/localDay";
import { Request, Response } from "express";
import raceView from "../services/raceView";

const readRace = async ({ query, user }: Request, res: Response) =>
  res.status(200).json(await raceView(user!, parseTzOffset(query.tzOffset)));

export default readRace;
