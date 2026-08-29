import { NextFunction, Request, Response } from "express";

const parseQuery = (req: Request, _res: Response, next: NextFunction) => {
  for (const key in req.query) {
    const val = req.query[key];
    if (val === "true") req.query[key] = true as any;
    else if (val === "false") req.query[key] = false as any;
  }
  next();
};

export default parseQuery;
