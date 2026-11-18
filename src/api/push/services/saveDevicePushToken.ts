import PushTokenEntity from "@/entities/PushTokenEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

export type DeviceToken = { installId: string; token: string; platform: string; lang: string; news: boolean };

const saveDevicePushToken = async (device: DeviceToken, manager?: EntityManager) => {
  const m = findManager(UserRepository, manager);
  const existing = await m.findOne(PushTokenEntity, { where: { token: device.token } });
  const fields = { ...device, user: null, lastSeenAt: new Date() };
  if (existing) {
    await m.update(PushTokenEntity, existing.id, fields);
    return;
  }
  await m.save(PushTokenEntity, fields as PushTokenEntity);
};

export default saveDevicePushToken;
