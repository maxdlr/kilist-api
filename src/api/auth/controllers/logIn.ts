import { Request, Response } from "express";
import bcrypt from "bcrypt";
import setAuthCookies from "../services/setAuthCookie";
import findUser from "@/api/users/services/findUser";

const logIn = async ({ body }: Request, res: Response) => {
  const user = await findUser({ username: body.username }, true);

  if (!user) {
    throw ApiError("Email ou mot de passe incorrect");
  }

  if (!bcrypt.compareSync(body.password, user.password)) {
    throw ApiError("Email ou mot de passe incorrect");
  }

  const { id, email, username } = user;

  // Define cookie payload
  const cookiePayload: any = {
    id,
    email,
    username,
  };

  await setAuthCookies(res, cookiePayload);
  // type is returned to help the front-end redirect the user to the right flow
  return res.status(202).end();
};
export default logIn;
