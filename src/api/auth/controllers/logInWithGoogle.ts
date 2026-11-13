import importGuestData from "@/api/sync/services/importGuestData";
import createGoogleUser from "@/api/users/services/createGoogleUser";
import findGoogleUser from "@/api/users/services/findGoogleUser";
import linkGoogleAccount from "@/api/users/services/linkGoogleAccount";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import setAuthCookies from "../services/setAuthCookie";
import verifyGoogleToken from "../services/verifyGoogleToken";

const logInWithGoogle = async ({ body }: Request, res: Response) => {
  const identity = await verifyGoogleToken(body?.idToken);

  const created = await doTransaction(async (m) => {
    const known = await findGoogleUser(identity, m);

    if (known && known.googleId && known.googleId !== identity.googleId) {
      throw UserError(400, "auth.userExists");
    }
    if (known && !known.googleId) await linkGoogleAccount(known, identity.googleId, m);

    const user = known ?? (await createGoogleUser(identity, m));
    if (!known && body.guest) {
      await importGuestData(user, body.guest, m, { withPreferences: true });
    }

    await setAuthCookies(res, { id: user.id, email: user.email, username: user.username }, m);
    return !known;
  });

  return res.status(202).send({ created });
};

export default logInWithGoogle;
