import { Request, Response } from "express";
import { idOf } from "../../helpers";
import moveAdminUser from "../../services/users/moveAdminUser";

const moveUser = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await moveAdminUser(admin!, idOf(params.id), body?.joinCode));

export default moveUser;
