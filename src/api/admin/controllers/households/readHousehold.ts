import { Request, Response } from "express";
import { idOf } from "../../helpers";
import readAdminHousehold from "../../services/households/readAdminHousehold";

const readHousehold = async ({ params }: Request, res: Response) =>
  res.status(200).json(await readAdminHousehold(idOf(params.id)));

export default readHousehold;
