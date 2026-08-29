import { Request, Response } from "express";
import removeUser from "../../users/services/removeUser";

const deleteUser = async (
  { query, user }: Request,
  res: Response,
): Promise<Response<string>> => {
  if (!user || user.type !== "admin") {
    throw Unauthorized();
  }

  if (user.id !== query.id && user.type !== "admin") {
    throw Unauthorized();
  }

  await removeUser(query);

  return res.status(200).send("User deleted");
};

export default deleteUser;
