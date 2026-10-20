import { SessionStatus } from "@/entities/SessionEntity";
import doTransaction from "@/utils/doTransaction";
import { Request, Response } from "express";
import findSession from "../services/findSession";
import updateSession from "../services/updateSession";

const readSession = async ({ params }: Request, res: Response) => {
  const sessionId = Number(params.id);

  if (!sessionId || Number.isNaN(sessionId)) {
    throw ApiError("A valid sessionId is required");
  }

  const session = await doTransaction(async (m) => {
    let session = await findSession({ id: sessionId }, m);

    if (!session) {
      throw Missing(`Session with id ${sessionId} not found`);
    }

    if (session.startFoods.length === 0) {
      throw ApiError("No start foods available for this session");
    }

    if (session.startFoods.length === session.boughtFoods.length) {
      session = await updateSession(
        {
          id: sessionId,
          status: SessionStatus.COMPLETED,
          endedAt: new Date(),
        },
        m,
      );

      return null;
    }

    return session;
  });

  return res.status(200).send(session);
};

export default readSession;
