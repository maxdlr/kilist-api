import { Request, Response } from "express";
import bcrypt from "bcrypt";
import setAuthCookies from "../services/setAuthCookie";
import findUser from "@/api/users/services/findUser";

const logIn = async ({ body }: Request, res: Response) => {
  const user = await findUser({ username: body.username }, true);

  if (!user) {
    throw UserError(400, "auth.badCredentials");
  }

  if (!bcrypt.compareSync(body.password, user.password)) {
    throw UserError(400, "auth.badCredentials");
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
