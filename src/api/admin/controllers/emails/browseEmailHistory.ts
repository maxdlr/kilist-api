import { Request, Response } from "express";
import browseAdminEmailLogs from "../../services/emails/browseAdminEmailLogs";

const browseEmailHistory = async ({ query }: Request, res: Response) =>
  res.status(200).json(await browseAdminEmailLogs(query));

export default browseEmailHistory;
