import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import checkRefreshToken from "./checkRefreshToken";
import deliverJwtToken from "./deliverJwtToken";
import RefreshTokenRepository from "@/repositories/RefreshTokenRepository";

const refreshSecret = process.env.JWT_REFRESH_SECRET;

/**
 * Rotate a refresh token:
 * - revoke the old token
 * - create a new refresh JWT with the same fixed expiry window
 * - link rotatedFrom → rotatedTo
 */
const rotateRefreshToken = async (
  token: string,
  reason: RefreshTokenEntity["revokedReason"],
) => {
  const { decoded: jwtPayload, refreshToken: refreshTokenDocument }: any =
    await checkRefreshToken(token);

  // 1. Revoke old token
  refreshTokenDocument.revokedReason = reason;
  refreshTokenDocument.revokedOn = new Date();

  await RefreshTokenRepository.save(refreshTokenDocument);
  // await refreshTokenDocument.save();

  // 2. Prepare payload (remove old JWT metadata)
  const payload = { ...jwtPayload };
  delete payload.iat;
  delete payload.exp;

  // 3. Compute remaining lifetime (do NOT extend expiry)
  const expireOn = refreshTokenDocument.expireOn;
  const remainingSeconds = Math.max(
    0,
    Math.floor((expireOn.getTime() - Date.now()) / 1000),
  );

  // 4. Generate a new refresh JWT
  const newRefreshToken = deliverJwtToken(
    payload,
    `${remainingSeconds}s`,
    refreshSecret,
  );

  // 5. Create new DB record

  const newRefreshTokenDocument = await RefreshTokenRepository.save({
    token: newRefreshToken,
    expireOn,
    userId: jwtPayload.id,
    appId: jwtPayload.app, // required
    rotatedFrom: refreshTokenDocument.id,
  });

  // 6. Link oldRecord → newRecord
  refreshTokenDocument.rotatedTo = newRefreshTokenDocument.id;
  await RefreshTokenRepository.save(refreshTokenDocument);

  return {
    newRefreshToken,
    refreshTokenMaxAge: Math.max(0, expireOn.getTime() - Date.now()),
  };
};
export default rotateRefreshToken;
