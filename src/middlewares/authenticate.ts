import { isLang } from "@/i18n";
import UserRepository from "@/repositories/UserRepository";
import findUser from "@/api/users/services/findUser";
import UserEntity from "@/entities/UserEntity";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthTokenPayload extends JwtPayload {
  id: number;
}

function isAuthPayload(payload: JwtPayload): payload is AuthTokenPayload {
  return typeof payload.id === "number";
}

const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const cookieToken: string | undefined = req?.signedCookies?.["auth"];
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET || !cookieToken) {
    return next(Unauthorized());
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(cookieToken, JWT_SECRET) as JwtPayload;
  } catch {
    return next(Unauthorized());
  }

  if (!isAuthPayload(decoded)) {
    return next(Unauthorized());
  }

  const user: UserEntity | null = await findUser({
    id: Number(decoded.id),
  }).catch((error) => {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  });
  if (!user) {
    return next(Unauthorized());
  }

  const device = req.headers["x-device-language"];
  if (isLang(device) && device !== user.deviceLanguage) {
    await UserRepository.update(user.id, { deviceLanguage: device });
    user.deviceLanguage = device;
  }

  req.user = user;

  // const { id, username, email } = user;
  // req.user = {
  //   id,
  //   username,
  //   email,
  // };

  return next();
};

export default authenticate;
