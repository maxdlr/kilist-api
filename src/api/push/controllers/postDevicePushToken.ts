import { isLang } from "@/i18n";
import { Request, Response } from "express";
import { isInstallId, isPushToken } from "../helpers";
import saveDevicePushToken from "../services/saveDevicePushToken";

const postDevicePushToken = async ({ body }: Request, res: Response) => {
  if (!isPushToken(body?.token)) {
    throw BadValidation([{ property: "token", messages: ["A valid push token is required"] }]);
  }
  if (!isInstallId(body?.installId)) {
    throw BadValidation([{ property: "installId", messages: ["A valid install id is required"] }]);
  }
  await saveDevicePushToken({
    installId: body.installId,
    token: body.token,
    platform: body.platform === "ios" ? "ios" : "android",
    lang: isLang(body.lang) ? body.lang : "",
    news: body.news !== false,
  });
  return res.status(204).end();
};

export default postDevicePushToken;
