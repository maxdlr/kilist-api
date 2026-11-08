import { Request, Response } from "express";
import { idOf } from "../../helpers";
import deleteAdminHousehold from "../../services/households/deleteAdminHousehold";

const deleteHousehold = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await deleteAdminHousehold(admin!, idOf(params.id)));

export default deleteHousehold;
