import findUser from "@/api/users/services/findUser";
import updateUserColumns from "@/api/users/services/updateUserColumns";
import { isLang } from "@/i18n";
import doTransaction from "@/utils/doTransaction";
import type { Request, Response } from "express";

const editMyLanguage = async ({ body, user }: Request, res: Response) => {
  if (!user) {
    throw Unauthorized("user");
  }

  const language = body?.language ?? null;
  if (language !== null && !isLang(language)) {
    throw ApiError("language must be a supported language code or null");
  }

  const updated = await doTransaction(async (m) => {
    await updateUserColumns(user.id, { language }, m);
    return findUser({ id: user.id }, false, m);
  });

  return res.status(200).send(updated);
};

export default editMyLanguage;
