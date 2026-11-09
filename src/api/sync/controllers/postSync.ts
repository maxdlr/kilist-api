import { Request, Response } from "express";
import runSync from "../services/runSync";

const postSync = async ({ body, user }: Request, res: Response) => {
  const ops = body?.ops ?? [];

  if (!Array.isArray(ops)) {
    throw ApiError("ops must be an array");
  }

  const result = await runSync(user!, {
    ops,
    sentAt: body?.sentAt,
    knownHash: body?.knownHash,
  });

  return res.status(200).json(result);
};

export default postSync;
