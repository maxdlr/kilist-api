import { Request, Response } from "express";
import browseAdminUsers from "../../services/users/browseAdminUsers";

const browseUsers = async ({ query }: Request, res: Response) =>
  res.status(200).json(await browseAdminUsers(query));

export default browseUsers;
