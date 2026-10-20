import SessionEntity from "@/entities/SessionEntity";
import SessionRepository from "@/repositories/SessionRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const updateSession = async (
  session: Partial<SessionEntity>,
  manager?: EntityManager,
) => {
  if (!session.id) {
    throw Missing("Session id is required to update a session");
  }

  const m = findManager(SessionRepository, manager);

  const updatedSession = await m.save(SessionEntity, session);

  return updatedSession;
};
export default updateSession;
