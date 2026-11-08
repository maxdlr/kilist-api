import { Request, Response } from "express";
import { idOf } from "../../helpers";
import setUserSkin from "../../services/users/setUserSkin";

const setSkin = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await setUserSkin(admin!, idOf(params.id), body?.skin));

export default setSkin;
