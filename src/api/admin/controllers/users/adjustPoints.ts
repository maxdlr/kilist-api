import { Request, Response } from "express";
import { idOf } from "../../helpers";
import adjustUserPoints from "../../services/users/adjustUserPoints";

const adjustPoints = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await adjustUserPoints(admin!, idOf(params.id), body));

export default adjustPoints;
