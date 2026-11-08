import { Request, Response } from "express";
import runAdminJob from "../../services/jobs/runAdminJob";

const runJob = async ({ body, params, user }: Request, res: Response) => {
  const dryRun = body?.dryRun !== false;
  const input = Object.fromEntries(
    Object.entries(body?.input ?? {}).filter(([, value]) => typeof value === "string"),
  ) as Record<string, string>;
  const result = await runAdminJob(String(params.id ?? ""), dryRun, user!.id, input);
  return res.status(200).json(result);
};

export default runJob;
