import type RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";

const revokeAllRefreshTokenByUserId = async (
  userId: number,
  reason: RefreshTokenEntity["revokedReason"],
) => {
  if (!userId) {
    throw ApiError("User ID is required to revoke refresh tokens");
  }

  if (!reason) {
    throw ApiError("Reason is required to revoke refresh tokens");
  }

  return await RefreshTokenRepository.update(
    { userId: userId },
    {
      revokedOn: new Date(),
      revokedReason: reason,
    },
  );
};

export default revokeAllRefreshTokenByUserId;
