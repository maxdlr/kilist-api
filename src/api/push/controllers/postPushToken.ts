import { Request, Response } from "express";
import { isPushToken } from "../helpers";
import savePushToken from "../services/savePushToken";

const postPushToken = async ({ body, user }: Request, res: Response) => {
  if (!isPushToken(body?.token)) {
    throw BadValidation([{ property: "token", messages: ["A valid push token is required"] }]);
  }
  await savePushToken(user!.id, body.token, body.platform === "ios" ? "ios" : "android");
  return res.status(204).end();
};

export default postPushToken;
