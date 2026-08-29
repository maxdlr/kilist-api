import chalk from "chalk";
import { Request, Response, NextFunction } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Request logging
  console.log(
    chalk.bgBlue.white.bold(`\n[REQ] ${req.method} ${req.originalUrl}`),
  );
  console.log(chalk.cyan("Params:"), req.params);
  console.log(chalk.cyan("Query:"), req.query);
  console.log(chalk.cyan("Body:"), req.body);
  console.log(chalk.cyan("User:"), req.user?.username);

  // Patch res.json to log response body
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    console.log(
      chalk.bgGreen.black.bold(`[RES] ${req.method} ${req.originalUrl}`),
    );
    // console.log(chalk.green("Response body:"), JSON.stringify(body, null, 2));
    return originalJson(body);
  };

  next();
};
