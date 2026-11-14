import { hideJoinCode } from "@/api/households/helpers";
import findUser from "@/api/users/services/findUser";
import isUsernameTaken from "@/api/users/services/isUsernameTaken";
import updateUserColumns from "@/api/users/services/updateUserColumns";
import doTransaction from "@/utils/doTransaction";
import type { Request, Response } from "express";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

const editMyUsername = async ({ body, user }: Request, res: Response) => {
  if (!user) {
    throw Unauthorized("user");
  }

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  if (!username) throw UserError(400, "validation.username.required");
  if (username.length < USERNAME_MIN) throw UserError(400, "validation.username.short");
  if (username.length > USERNAME_MAX) throw UserError(400, "validation.username.long");

  const updated = await doTransaction(async (m) => {
    if (await isUsernameTaken(username, user.id, m)) {
      throw UserError(400, "auth.usernameTaken");
    }
    await updateUserColumns(user.id, { username }, m);
    return findUser({ id: user.id }, false, m);
  });

  return res.status(200).send(hideJoinCode(updated));
};

export default editMyUsername;
