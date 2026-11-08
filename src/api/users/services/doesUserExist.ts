import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const doesUserExist = async (
  id: number,
  manager?: EntityManager,
): Promise<boolean> => {
  const m = findManager(UserRepository, manager);
  const userExists = await m.exists(UserEntity, {
    where: { id: id },
  });
  return userExists;
};

export default doesUserExist;
