import { Request, Response } from "express";
import installStats from "../../services/stats/installStats";

const readInstallStats = async ({ query }: Request, res: Response) => {
  const days = [7, 30].includes(Number(query.days)) ? Number(query.days) : 0;
  return res.status(200).json(await installStats(days));
};

export default readInstallStats;
