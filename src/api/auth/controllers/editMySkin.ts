import skinAccess from "@/api/prizes/services/skinAccess";
import findUser from "@/api/users/services/findUser";
import updateUserColumns from "@/api/users/services/updateUserColumns";
import { SKIN_PATTERN } from "@/entities/UserEntity";
import doTransaction from "@/utils/doTransaction";
import type { Request, Response } from "express";

const editMySkin = async ({ body, user }: Request, res: Response) => {
  if (!user) {
    throw Unauthorized("user");
  }

  const skin = body?.skin;
  if (typeof skin !== "string" || !SKIN_PATTERN.test(skin)) {
    throw ApiError("skin must be a lowercase skin id");
  }

  const updated = await doTransaction(async (m) => {
    const access = await skinAccess(user.id, skin, m, user.type === "admin");
    if (access === "unknown") {
      throw UserError(400, "skins.unknown");
    }
    if (access === "locked") {
      throw UserError(403, "skins.locked");
    }

    await updateUserColumns(user.id, { skin }, m);

    return findUser({ id: user.id }, false, m);
  });

  return res.status(200).send(updated);
};

export default editMySkin;
