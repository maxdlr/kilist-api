import type { Request, Response } from "express";
import clearAuthCookies from "../services/clearAuthCookies";
import revokeAllRefreshTokenByUserId from "../services/revokeAllRefreshTokenByUserId";

const logOut = async ({ user, signedCookies }: Request, res: Response) => {
  const refreshToken = signedCookies?.refresh;

  if (user && refreshToken) {
    await revokeAllRefreshTokenByUserId(user.id, "user-logout");
    await clearAuthCookies(res);
  }

  return res.status(200).end();
};

export default logOut;
