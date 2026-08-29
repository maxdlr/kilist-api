import createUser from "@/api/users/services/createUser";
import { Request, Response } from "express";
import setAuthCookies from "../services/setAuthCookie";

const signUp = async ({ body }: Request, res: Response) => {
  const { email, username } = body;

  const user = await createUser(body);

  const cookiePayload: any = {
    id: user.id,
    email,
    username,
  };

  await setAuthCookies(res, cookiePayload);

  return res.status(202).send();
};
export default signUp;
