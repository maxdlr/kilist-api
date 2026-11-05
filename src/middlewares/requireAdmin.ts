import { NextFunction, Request, Response } from "express";

const requireAdmin = (
  { user }: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!user) {
    return next(Unauthorized());
  }

  if (user.type !== "admin") {
    return next(Forbidden());
  }

  return next();
};

export default requireAdmin;
