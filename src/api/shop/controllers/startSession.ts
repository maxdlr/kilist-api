import { Request, Response } from "express";
import createSession from "../services/createSession";
import findSession from "../services/findSession";
import { IsNull } from "typeorm";

const startSession = async (_: Request, res: Response) => {
  const existingOpenSession = await findSession({
    endedAt: IsNull(),
  });

  if (existingOpenSession) {
    return res.status(200).json(existingOpenSession);
  }

  const session = await createSession();

  return res.status(200).json(session);
};

export default startSession;
