import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const createRefreshToken = async (
  token: string,
  userId: number,
  manager?: EntityManager,
) => {
  const m = findManager(RefreshTokenRepository, manager);
  const expireOn = new Date(new Date().setDate(new Date().getDate() + 15)); // 15d from now

  await m.save(RefreshTokenEntity, {
    token,
    expireOn,
    userId: Number(userId),
  });

  return token;
};

export default createRefreshToken;
