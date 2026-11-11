import findHousehold from "@/api/households/services/findHousehold";
import importGuestData from "@/api/sync/services/importGuestData";
import sendVerificationEmail from "@/api/verification/services/sendVerificationEmail";
import createUser from "@/api/users/services/createUser";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import setAuthCookies from "../services/setAuthCookie";

const signUp = async ({ body }: Request, res: Response) => {
  const { email, username } = body;
  const wantsToJoin = body?.householdChoice === "join";

  const user = await doTransaction(async (m) => {
    if (wantsToJoin && !(await findHousehold({ joinCode: String(body.joinCode ?? "") }, m))) {
      throw UserError(404, "household.codeNotFound");
    }

    const user = await createUser(
      wantsToJoin ? { ...body, householdChoice: "create", householdName: undefined } : body,
      m,
    );

    if (body.guest) {
      await importGuestData(user, body.guest, m, { withPreferences: true });
    }

    const cookiePayload: any = {
      id: user.id,
      email,
      username,
    };

    await setAuthCookies(res, cookiePayload, m);
    return user;
  });

  sendVerificationEmail(user, "confirm").catch((error) =>
    console.error("Failed to send the confirmation code", error?.message ?? error),
  );

  return res.status(202).send({ joinPending: wantsToJoin });
};
export default signUp;
