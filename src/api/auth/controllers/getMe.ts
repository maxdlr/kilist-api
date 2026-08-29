import type { Request, Response } from "express";
import findUser from "@/api/users/services/findUser";
import type UserEntity from "@/entities/UserEntity";

const getMe = async (
  { user }: Request,
  res: Response,
): Promise<Response<UserEntity>> => {
  if (!user) {
    throw Unauthorized("user");
  }
  const me = await findUser({ id: user.id });
  return res.status(200).send(me);
};
export default getMe;
