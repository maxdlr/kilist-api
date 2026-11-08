import { Request, Response } from "express";
import { idOf } from "../../helpers";
import renameAdminHousehold from "../../services/households/renameAdminHousehold";

const renameHousehold = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await renameAdminHousehold(admin!, idOf(params.id), body?.name));

export default renameHousehold;
