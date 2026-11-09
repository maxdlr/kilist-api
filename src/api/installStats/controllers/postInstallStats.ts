import { Request, Response } from "express";
import { MAX_DAYS_PER_REQUEST, parseInstallStat } from "../helpers";
import recordInstallStats from "../services/recordInstallStats";

const postInstallStats = async ({ body }: Request, res: Response) => {
  const days = Array.isArray(body?.days) ? body.days.slice(0, MAX_DAYS_PER_REQUEST) : [];
  const entries = days
    .map((day: unknown) => parseInstallStat(day, body?.installId))
    .filter((entry: unknown) => entry !== null);

  if (entries.length === 0) {
    throw ApiError("No valid stats");
  }

  const saved = await recordInstallStats(entries);

  return res.status(200).json({ saved });
};

export default postInstallStats;
