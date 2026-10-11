import SessionEntity from "@/entities/SessionEntity";
import SessionRepository from "@/repositories/SessionRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const createSession = (manager?: EntityManager) => {
  const m = findManager(SessionRepository, manager);

  const session = new SessionEntity();

  return m.save(SessionEntity, session);
};
export default createSession;
