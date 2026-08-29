import { Request, Response } from "express";
import updateUser from "../../users/services/updateUser";
import UserEntity from "@/entities/UserEntity";

const editUser = async (
  { user, body }: Request,
  res: Response,
): Promise<Response<UserEntity>> => {
  if (!user) {
    throw ApiError("User missing");
  }

  const updatedUser = await updateUser({ id: user.id, ...body });
  return res.status(200).send(updatedUser);
};

export default editUser;
