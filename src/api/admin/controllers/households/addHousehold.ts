import { Request, Response } from "express";
import addAdminHousehold from "../../services/households/addAdminHousehold";

const addHousehold = async ({ body, user: admin }: Request, res: Response) =>
  res.status(201).json(await addAdminHousehold(admin!, body?.name));

export default addHousehold;
