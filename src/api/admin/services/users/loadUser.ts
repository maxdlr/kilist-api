import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const loadUser = async (id: number, manager?: EntityManager) => {
  const user = await findManager(UserRepository, manager).findOne(UserEntity, { where: { id }, relations: { household: true } });
  if (!user) throw Missing(`User ${id} not found`);
  return user;
};

export default loadUser;
