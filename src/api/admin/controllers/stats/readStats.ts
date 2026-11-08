import { Request, Response } from "express";
import adminStats from "../../services/stats/adminStats";

const readStats = async ({ query }: Request, res: Response) => {
  const days = [7, 30].includes(Number(query.days)) ? Number(query.days) : 0;
  return res.status(200).json(await adminStats(days));
};

export default readStats;
