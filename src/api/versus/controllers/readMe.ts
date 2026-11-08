import { parseTzOffset } from "@/helpers/localDay";
import { Request, Response } from "express";
import meStats from "../services/meStats";

const readMe = async ({ query, user }: Request, res: Response) =>
  res.status(200).json(await meStats(user!, parseTzOffset(query.tzOffset)));

export default readMe;
