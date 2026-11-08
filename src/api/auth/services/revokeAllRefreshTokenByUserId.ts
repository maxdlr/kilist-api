import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const revokeAllRefreshTokenByUserId = async (
  userId: number,
  reason: RefreshTokenEntity["revokedReason"],
  manager?: EntityManager,
) => {
  const m = findManager(RefreshTokenRepository, manager);

  if (!userId) {
    throw ApiError("User ID is required to revoke refresh tokens");
  }

  if (!reason) {
    throw ApiError("Reason is required to revoke refresh tokens");
  }

  return await m.update(
    RefreshTokenEntity,
    { userId: userId },
    {
      revokedOn: new Date(),
      revokedReason: reason,
    },
  );
};

export default revokeAllRefreshTokenByUserId;
