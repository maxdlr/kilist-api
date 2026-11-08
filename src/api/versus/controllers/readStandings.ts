import { parseTzOffset } from "@/helpers/localDay";
import { Request, Response } from "express";
import standings from "../services/standings";

const readStandings = async ({ query, user }: Request, res: Response) =>
  res
    .status(200)
    .json(
      await standings(
        user!,
        parseTzOffset(query.tzOffset),
        query.period === "season" ? "season" : "week",
      ),
    );

export default readStandings;
