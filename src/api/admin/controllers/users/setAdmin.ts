import { Request, Response } from "express";
import { idOf } from "../../helpers";
import setUserAdmin from "../../services/users/setUserAdmin";

const setAdmin = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await setUserAdmin(admin!, idOf(params.id), body?.admin === true));

export default setAdmin;
