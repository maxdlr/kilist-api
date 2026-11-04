import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

/**
 * Lists all users belonging to a household.
 *
 * @param householdId - The household whose members to list
 * @param manager - Optional entity manager for transaction support
 * @returns The household's member users
 */
const findHouseholdMembers = async (
  householdId: number,
  manager?: EntityManager,
): Promise<UserEntity[]> => {
  const m = findManager(UserRepository, manager);

  return await m.find(UserEntity, {
    where: { household: { id: householdId } },
    order: { username: "ASC" },
  });
};

export default findHouseholdMembers;
