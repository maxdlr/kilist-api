import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager, Not } from "typeorm";

const isUsernameTaken = async (
  username: string,
  exceptUserId: number,
  manager?: EntityManager,
): Promise<boolean> => {
  const m = findManager(UserRepository, manager);
  return m.exists(UserEntity, { where: { username, id: Not(exceptUserId) } });
};

export default isUsernameTaken;
