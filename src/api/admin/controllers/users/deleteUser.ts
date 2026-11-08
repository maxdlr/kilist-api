import { Request, Response } from "express";
import { idOf } from "../../helpers";
import deleteAdminUser from "../../services/users/deleteAdminUser";

const deleteUser = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await deleteAdminUser(admin!, idOf(params.id)));

export default deleteUser;
