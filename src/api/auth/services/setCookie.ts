import { CookieOptions, Response } from "express";

const setCookie = (
  res: Response,
  cookieName: string,
  data: any,
  maxAge = 900000, // 15min
) => {
  const isProd = process.env.NODE_ENV === "production";

  const params: CookieOptions = {
    sameSite: isProd ? "strict" : "lax",
    httpOnly: true,
    maxAge,
    signed: true,
    secure: isProd,
  };
  res.cookie(cookieName, data, params);
};

export default setCookie;
