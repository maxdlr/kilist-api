import PushTokenEntity from "@/entities/PushTokenEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In } from "typeorm";

const removePushTokens = async (tokens: string[], userId?: number, manager?: EntityManager) => {
  if (tokens.length === 0) return;
  await findManager(UserRepository, manager).delete(PushTokenEntity, {
    token: In(tokens),
    ...(userId !== undefined && { user: { id: userId } }),
  });
};

export default removePushTokens;
