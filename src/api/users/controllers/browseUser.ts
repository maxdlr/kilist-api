import { Request, Response } from "express";
import findAllUsers from "../../users/services/findAllUsers";
import UserEntity from "@/entities/UserEntity";

const browseUsers = async (
  req: Request,
  res: Response,
): Promise<Response<UserEntity[]>> => {
  const users = await findAllUsers(req.query);

  return res.status(200).send(users);
};

export default browseUsers;
