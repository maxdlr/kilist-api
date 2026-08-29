import { CookieOptions, Response } from "express";

/**
 * Clears authentication and refresh cookies for a given application ID.
 *
 * This function removes the cookies named `auth` and `refresh` from the response,
 * using secure cookie options appropriate for the current environment.
 *
 * @param res - The Express response object used to clear cookies.
 */
const clearAuthCookies = async (res: Response) => {
  const isProd = process.env.NODE_ENV === "production";

  const options: CookieOptions = {
    sameSite: isProd ? "strict" : "none",
    httpOnly: true,
    maxAge: 0,
    signed: true,
    secure: true,
  };

  res.clearCookie(`auth`, options);
  res.clearCookie(`refresh`, options);
};

export default clearAuthCookies;
