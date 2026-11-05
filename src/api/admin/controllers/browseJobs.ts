import AdminJobRunEntity from "@/entities/AdminJobRunEntity";
import AdminJobRunRepository from "@/repositories/AdminJobRunRepository";
import { Request, Response } from "express";
import { ADMIN_JOBS } from "../jobs";

const browseJobs = async (_req: Request, res: Response) => {
  const jobs = await Promise.all(
    ADMIN_JOBS.map(async ({ id, title, description }) => {
      const lastRun: AdminJobRunEntity | null =
        await AdminJobRunRepository.findOne({
          where: { jobId: id },
          order: { createdAt: "DESC", id: "DESC" },
        });

      return {
        id,
        title,
        description,
        lastRun: lastRun && {
          dryRun: lastRun.dryRun,
          affected: lastRun.affected,
          summary: lastRun.summary,
          ranAt: lastRun.createdAt,
        },
      };
    }),
  );

  return res.status(200).json(jobs);
};

export default browseJobs;
