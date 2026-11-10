import PushTokenEntity from "@/entities/PushTokenEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const findPushTokens = async (userId: number, manager?: EntityManager) =>
  (await findManager(UserRepository, manager).find(PushTokenEntity, { where: { user: { id: userId } } })).map(
    (entry) => entry.token,
  );

export default findPushTokens;
