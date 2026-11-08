import { Request, Response } from "express";
import browseAdminActions from "../../services/actions/browseAdminActions";

const browseActions = async ({ query }: Request, res: Response) =>
  res.status(200).json(await browseAdminActions(query.limit));

export default browseActions;
