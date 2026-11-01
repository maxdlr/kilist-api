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

  // Must match the options setCookie used when the cookie was set —
  // otherwise some clients (e.g. a Secure cookie over plain HTTP in dev)
  // silently ignore the clear and the original cookie stays active.
  const options: CookieOptions = {
    sameSite: isProd ? "strict" : "lax",
    httpOnly: true,
    maxAge: 0,
    signed: true,
    secure: isProd,
  };

  res.clearCookie(`auth`, options);
  res.clearCookie(`refresh`, options);
};

export default clearAuthCookies;
