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

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, refreshSecret) as JwtPayload;
  } catch {
    throw Unauthorized();
  }

  if (!decoded.id) {
    throw Unauthorized();
  }

  const refreshToken = await m.findOneBy(RefreshTokenEntity, {
    token,
    userId: decoded.id,
  });

  if (!refreshToken) {
    throw Unauthorized();
  }

  if (refreshToken.isExpired) {
    throw Unauthorized();
  }

  if (refreshToken.revokedOn) {
    const successor =
      refreshToken.revokedReason === "token-replaced" && refreshToken.rotatedTo
        ? await m.findOneBy(RefreshTokenEntity, { id: refreshToken.rotatedTo })
        : null;
    if (!successor || successor.revokedOn) {
      throw Unauthorized();
    }
  }

  return { refreshToken, decoded };
};

export default checkRefreshToken;
