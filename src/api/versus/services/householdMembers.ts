import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const householdMembers = (householdId: number, manager?: EntityManager) =>
  findManager(UserRepository, manager).find(UserEntity, {
    where: { household: { id: householdId } },
    select: { id: true, username: true },
    order: { id: "ASC" },
  });

export default householdMembers;
