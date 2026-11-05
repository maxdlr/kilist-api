import AdminJobRunEntity from "@/entities/AdminJobRunEntity";
import UserEntity from "@/entities/UserEntity";
import doTransaction from "@/utils/doTransaction";
import { findAdminJob } from "../jobs";

const runAdminJob = async (jobId: string, dryRun: boolean, userId: number) => {
  const job = findAdminJob(jobId);
  if (!job) throw Missing(`Job ${jobId} not found`);

  return doTransaction(async (m) => {
    const result = await job.run(m, dryRun);
    const run = await m.save(AdminJobRunEntity, {
      jobId: job.id,
      ranBy: { id: userId } as UserEntity,
      dryRun,
      affected: result.affected,
      summary: result.summary.slice(0, 500),
    });

    return { ...result, dryRun, ranAt: run.createdAt };
  });
};

export default runAdminJob;
