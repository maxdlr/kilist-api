import findUser from "@/api/users/services/findUser";
import { SKIN_PATTERN } from "@/entities/UserEntity";
import { skinAccess } from "@/api/prizes/services/tickets";
import UserRepository from "@/repositories/UserRepository";
import type { Request, Response } from "express";

const editMySkin = async ({ body, user }: Request, res: Response) => {
  if (!user) {
    throw Unauthorized("user");
  }

  const skin = body?.skin;
  if (typeof skin !== "string" || !SKIN_PATTERN.test(skin)) {
    throw ApiError("skin must be a lowercase skin id");
  }

  const access = await skinAccess(user.id, skin, undefined, user.type === "admin");
  if (access === "unknown") {
    throw UserError(400, "skins.unknown");
  }
  if (access === "locked") {
    throw UserError(403, "skins.locked");
  }

  await UserRepository.update(user.id, { skin });

  return res.status(200).send(await findUser({ id: user.id }));
};

export default editMySkin;
