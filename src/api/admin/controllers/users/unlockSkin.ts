import { Request, Response } from "express";
import { idOf } from "../../helpers";
import unlockUserSkin from "../../services/users/unlockUserSkin";

const unlockSkin = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(201).json(await unlockUserSkin(admin!, idOf(params.id), body?.prizeId, body?.wear === true));

export default unlockSkin;
