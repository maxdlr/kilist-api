import SessionEntity from "@/entities/SessionEntity";
import SessionRepository from "@/repositories/SessionRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const updateSession = async (
  session: SessionEntity,
  manager?: EntityManager,
) => {
  if (!session.id) {
    throw Missing("Session id is required to update a session");
  }
  const m = findManager(SessionRepository, manager);
  return await m.save(SessionEntity, session);
};
export default updateSession;
