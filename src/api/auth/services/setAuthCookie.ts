import { Response } from "express";
import deliverJwtToken from "./deliverJwtToken";
import setCookie from "./setCookie";
import createRefreshToken from "./createRefreshToken";

const setAuthCookies = async (res: Response, payload: any) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!refreshSecret) {
    throw ApiError(500, "JWT refresh secret is required");
  }

  const accessTokenName = `auth`;
  const refreshTokenName = `refresh`;

  // Include app in JWT payload to bind token to its app
  const jwtPayload = { ...payload };

  // access token
  const accessTokenMaxAge = 60 * 4 * 1000; // 4m
  const accessToken = deliverJwtToken(jwtPayload, "4m");
  setCookie(res, accessTokenName, accessToken, accessTokenMaxAge);

  // refresh token
  const refreshTokenMaxAge = 60 * 60 * 24 * 15 * 1000; // 15 days
  const refreshToken = deliverJwtToken(jwtPayload, "15d", refreshSecret);
  setCookie(res, refreshTokenName, refreshToken, refreshTokenMaxAge);

  const userId = payload.id || payload.id;
  await createRefreshToken(refreshToken, userId);

  return { accessToken, refreshToken };
};

export default setAuthCookies;
