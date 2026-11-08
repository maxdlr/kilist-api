import { Request, Response } from "express";
import { idOf } from "../../helpers";
import readAdminUser from "../../services/users/readAdminUser";

const readUser = async ({ params }: Request, res: Response) =>
  res.status(200).json(await readAdminUser(idOf(params.id)));

export default readUser;
