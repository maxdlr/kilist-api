import PushTokenEntity from "@/entities/PushTokenEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const savePushToken = async (userId: number, token: string, platform: string, manager?: EntityManager) => {
  const m = findManager(UserRepository, manager);
  const existing = await m.findOne(PushTokenEntity, { where: { token } });
  if (existing) {
    await m.update(PushTokenEntity, existing.id, { user: { id: userId }, platform, lastSeenAt: new Date() });
    return;
  }
  await m.save(PushTokenEntity, { user: { id: userId }, token, platform, lastSeenAt: new Date() } as PushTokenEntity);
};

export default savePushToken;
