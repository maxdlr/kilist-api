import { Request, Response } from "express";
import browseAdminHouseholds from "../../services/households/browseAdminHouseholds";

const browseHouseholds = async ({ query }: Request, res: Response) =>
  res.status(200).json(await browseAdminHouseholds(query));

export default browseHouseholds;
