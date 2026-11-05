import { Request, Response } from "express";
import runAdminJob from "../services/runAdminJob";

const runJob = async ({ body, params, user }: Request, res: Response) => {
  const dryRun = body?.dryRun !== false;
  const result = await runAdminJob(String(params.id ?? ""), dryRun, user!.id);
  return res.status(200).json(result);
};

export default runJob;
