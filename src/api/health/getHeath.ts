import { Request, Response } from "express";

const getHealth = (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy" });
};

export default getHealth;
