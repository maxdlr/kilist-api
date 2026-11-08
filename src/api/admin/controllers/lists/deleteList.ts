import { Request, Response } from "express";
import { idOf } from "../../helpers";
import deleteAdminList from "../../services/lists/deleteAdminList";

const deleteList = async ({ params, user: admin }: Request, res: Response) =>
  res.status(200).json(await deleteAdminList(admin!, idOf(params.id)));

export default deleteList;
