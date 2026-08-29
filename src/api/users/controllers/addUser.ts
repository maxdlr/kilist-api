import UserEntity from "@/entities/UserEntity";
import { Request, Response } from "express";
import createUser from "../services/createUser";

const addUser = async (
  req: Request,
  res: Response,
): Promise<Response<UserEntity>> => {
  const user = req.body.user;
  if (!user) {
    throw ApiError("User missing");
  }
  const createdUser = await createUser(user);
  return res.status(200).send(createdUser);
};

export default addUser;
