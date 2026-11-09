import importGuestData from "@/api/sync/services/importGuestData";
import createUser from "@/api/users/services/createUser";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import setAuthCookies from "../services/setAuthCookie";

const signUp = async ({ body }: Request, res: Response) => {
  const { email, username } = body;

  await doTransaction(async (m) => {
    const user = await createUser(body, m);

    if (body.guest) {
      await importGuestData(user, body.guest, m, { withPreferences: true });
    }

    const cookiePayload: any = {
      id: user.id,
      email,
      username,
    };

    await setAuthCookies(res, cookiePayload, m);
  });

  return res.status(202).send();
};
export default signUp;
