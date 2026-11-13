import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const updateUserColumns = async (
  id: number,
  columns: Partial<Pick<UserEntity, "skin" | "language" | "deviceLanguage" | "type" | "username" | "email" | "household" | "emailConfirmedAt" | "notifications" | "googleId">>,
  manager?: EntityManager,
) => {
  const m = findManager(UserRepository, manager);
  await m.update(UserEntity, id, columns);
};

export default updateUserColumns;
