import { Request, Response } from "express";
import { idOf } from "../../helpers";
import removeUserUnlock from "../../services/users/removeUserUnlock";

const removeUnlock = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await removeUserUnlock(admin!, idOf(params.id), String(params.prizeId ?? "")));

export default removeUnlock;
