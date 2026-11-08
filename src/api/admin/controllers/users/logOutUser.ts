import { Request, Response } from "express";
import { idOf } from "../../helpers";
import logOutAdminUser from "../../services/users/logOutAdminUser";

const logOutUser = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await logOutAdminUser(admin!, idOf(params.id)));

export default logOutUser;
