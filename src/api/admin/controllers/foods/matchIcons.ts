import { Request, Response } from "express";
import matchFoodIcons from "../../services/foods/matchFoodIcons";

const matchIcons = async ({ user: admin }: Request, res: Response) =>
  res.status(200).json(await matchFoodIcons(admin!.id));

export default matchIcons;
