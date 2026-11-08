import { Request, Response } from "express";
import browseAdminJobs from "../../services/jobs/browseAdminJobs";

const browseJobs = async (_req: Request, res: Response) =>
  res.status(200).json(await browseAdminJobs());

export default browseJobs;
