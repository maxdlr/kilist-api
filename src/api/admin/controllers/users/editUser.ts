import { Request, Response } from "express";
import { idOf } from "../../helpers";
import editAdminUser from "../../services/users/editAdminUser";

const editUser = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await editAdminUser(admin!, idOf(params.id), body));

export default editUser;
