import { Request, Response } from "express";

const getHealth = (req: Request, res: Response) => {
  res.status(200).json({ status: "healthy" });
};

export default getHealth;
