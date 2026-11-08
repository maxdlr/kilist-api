import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";
import findManager from "@/utils/findManager";
import jwt, { JwtPayload } from "jsonwebtoken";
import { EntityManager } from "typeorm";

const checkRefreshToken = async (rawToken: string, manager?: EntityManager) => {
  const m = findManager(RefreshTokenRepository, manager);
  const token = rawToken;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!refreshSecret) {
    throw ApiError(500, "Refresh secret is required");
  }

  const decoded = jwt.verify(token, refreshSecret) as JwtPayload;

  if (!decoded.id) {
    throw ApiError("Refresh token failed verification");
  }

  const refreshToken = await m.findOneBy(RefreshTokenEntity, {
    token,
    userId: decoded.id,
  });

  if (!refreshToken) {
    throw ApiError("Refresh token not found");
  }

  if (refreshToken.revokedOn || refreshToken?.isExpired) {
    throw ApiError("Refresh token has been revoked");
  }

  return { refreshToken, decoded };
};

export default checkRefreshToken;
