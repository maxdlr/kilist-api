import SessionEntity from "@/entities/SessionEntity";
import SessionRepository from "@/repositories/SessionRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";

const findSession = async (
  where: FindOptionsWhere<SessionEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(SessionRepository, manager);

  const session = await m.findOne(SessionEntity, {
    where,
  });

  return session;
};
export default findSession;
