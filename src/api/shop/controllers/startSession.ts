import { Request, Response } from "express";
import createSession from "../services/createSession";

const startSession = async (_: Request, res: Response) => {
  const session = await createSession();
  return res.status(200).json(session);
};

export default startSession;
