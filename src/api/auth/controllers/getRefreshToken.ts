import doTransaction from "@/utils/doTransaction";
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

  const refreshed = await doTransaction(async (m) => {
    // Validate refresh token in DB
    const response: any = await checkRefreshToken(refreshToken, m);

    if (!response?.decoded) {
      return null;
    }

    // Rotate refresh token to prevent replay attacks
    const rotated = await rotateRefreshToken(refreshToken, "token-replaced", m);

    return { decoded: response.decoded, ...rotated };
  });

  if (!refreshed) {
    return next(Unauthorized());
  }

  //  All good, issue a new access token, rotate refresh token and let the user know
  const payload = {
    ...refreshed.decoded,
  };
  delete payload.iat;
  delete payload.exp;

  setCookie(res, `refresh`, refreshed.newRefreshToken, refreshed.refreshTokenMaxAge);

  const token = deliverJwtToken(payload, "4m");

  const cookieName = `auth`;

  setCookie(res, cookieName, token, 4 * 60 * 1000);

  return res.status(200).end();
};

export default getRefreshToken;
