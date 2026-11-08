import { Request, Response } from "express";
import { idOf } from "../../helpers";
import editAdminList from "../../services/lists/editAdminList";

const editList = async ({ params, body, user: admin }: Request, res: Response) =>
  res.status(200).json(await editAdminList(admin!, idOf(params.id), body));

export default editList;
