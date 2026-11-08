import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

interface UserFilters {
  search?: string;
  maxResults?: number | string;
}

const findAllUsers = async (
  where?: UserFilters,
  manager?: EntityManager,
): Promise<UserEntity[]> => {
  const m = findManager(UserRepository, manager);
  const {
    search: _search,
    maxResults: _maxResults,
    ...sanitizedWhere
  } = where || {};
  const users = await m.find(UserEntity, {
    where: sanitizedWhere,
    loadRelationIds: { relations: ["lists"] },
  });
  return users;
};

export default findAllUsers;
