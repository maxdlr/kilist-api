import { filteredParams } from "@/utils/filteredParams";
import { Request, Response } from "express";
import findUser from "../../users/services/findUser";
import UserEntity from "@/entities/UserEntity";

const readUser = async (
  req: Request,
  res: Response,
): Promise<Response<UserEntity>> => {
  const { id, username, email } = req.query;

  if (!id && !username && !email) {
    throw ApiError(400, "Id or username/email required to find user");
  }

  const params = filteredParams({
    id,
    username: username as string,
    email: email as string,
  });

  const user = await findUser(
    params as Pick<UserEntity, "id" | "username" | "email">,
  );

  return res.status(200).send(user);
};
export default readUser;
