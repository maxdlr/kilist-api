import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const lockUser = (userId: number, manager?: EntityManager) =>
  findManager(UserRepository, manager)
    .createQueryBuilder(UserEntity, "user")
    .setLock("pessimistic_write")
    .where("user.id = :userId", { userId })
    .getOne();

export default lockUser;
