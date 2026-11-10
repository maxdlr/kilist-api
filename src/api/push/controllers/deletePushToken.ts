import { Request, Response } from "express";
import { isPushToken } from "../helpers";
import removePushTokens from "../services/removePushTokens";

const deletePushToken = async ({ body, user }: Request, res: Response) => {
  if (isPushToken(body?.token)) await removePushTokens([body.token], user!.id);
  return res.status(204).end();
};

export default deletePushToken;
