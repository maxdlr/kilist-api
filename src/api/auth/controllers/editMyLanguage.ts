import findUser from "@/api/users/services/findUser";
import { isLang } from "@/i18n";
import UserRepository from "@/repositories/UserRepository";
import type { Request, Response } from "express";

const editMyLanguage = async ({ body, user }: Request, res: Response) => {
  if (!user) {
    throw Unauthorized("user");
  }

  const language = body?.language ?? null;
  if (language !== null && !isLang(language)) {
    throw ApiError("language must be a supported language code or null");
  }

  await UserRepository.update(user.id, { language });

  return res.status(200).send(await findUser({ id: user.id }));
};

export default editMyLanguage;
