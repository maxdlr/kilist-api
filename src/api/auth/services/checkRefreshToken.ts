import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";
import jwt, { JwtPayload } from "jsonwebtoken";

const checkRefreshToken = async (rawToken: string) => {
  const token = rawToken;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!refreshSecret) {
    throw ApiError(500, "Refresh secret is required");
  }

  const decoded = jwt.verify(token, refreshSecret) as JwtPayload;

  if (!decoded.id) {
    throw ApiError("Refresh token failed verification");
  }

  const refreshToken = await RefreshTokenRepository.findOneBy({
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
