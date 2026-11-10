import notifyHousehold from "@/api/notifications/services/notifyHousehold";
import importGuestData from "@/api/sync/services/importGuestData";
import sendVerificationEmail from "@/api/verification/services/sendVerificationEmail";
import createUser from "@/api/users/services/createUser";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import setAuthCookies from "../services/setAuthCookie";

const signUp = async ({ body }: Request, res: Response) => {
  const { email, username } = body;

  const user = await doTransaction(async (m) => {
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
    return user;
  });

  await sendVerificationEmail(user, "confirm").catch((error) =>
    console.error("Failed to send the confirmation code", error?.message ?? error),
  );
  if (body.householdChoice === "join") {
    await notifyHousehold("memberJoined", user.household.id, user).catch(() => 0);
  }

  return res.status(202).send();
};
export default signUp;
