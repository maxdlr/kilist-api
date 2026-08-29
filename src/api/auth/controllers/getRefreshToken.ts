import { NextFunction, Request, Response } from "express";
import checkRefreshToken from "../services/checkRefreshToken";
import rotateRefreshToken from "../services/rotateRefreshToken";
import deliverJwtToken from "../services/deliverJwtToken";
import setCookie from "../services/setCookie";

const getRefreshToken = async (
  { signedCookies }: Request,
  res: Response,
  next: NextFunction,
) => {
  const refreshToken = signedCookies?.[`refresh`];

  if (!refreshToken) {
    return next(Unauthorized());
  }

  // Validate refresh token in DB
  const response: any = await checkRefreshToken(refreshToken);

  if (!response?.decoded) {
    return next(Unauthorized());
  }

  const decoded = response.decoded;

  //  All good, issue a new access token, rotate refresh token and let the user know
  const payload = {
    ...decoded,
  };
  delete payload.iat;
  delete payload.exp;

  // Rotate refresh token to prevent replay attacks
  const { newRefreshToken, refreshTokenMaxAge } = await rotateRefreshToken(
    refreshToken,
    "token-replaced",
  );

  setCookie(res, `refresh`, newRefreshToken, refreshTokenMaxAge);

  const token = deliverJwtToken(payload, "4m");

  const cookieName = `auth`;

  setCookie(res, cookieName, token, 4 * 60 * 1000);

  return res.status(200).end();
};

export default getRefreshToken;
