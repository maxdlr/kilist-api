import AdminJobRunEntity from "@/entities/AdminJobRunEntity";
import UserEntity from "@/entities/UserEntity";
import inTransaction from "@/helpers/inTransaction";
import { EntityManager } from "typeorm";
import { findAdminJob } from "../../jobs";
import { AdminJobInput } from "../../jobs/types";

const runAdminJob = async (
  jobId: string,
  dryRun: boolean,
  userId: number,
  input: AdminJobInput = {},
  manager?: EntityManager,
) => {
  const job = findAdminJob(jobId);
  if (!job) throw Missing(`Job ${jobId} not found`);

  return inTransaction(manager, async (m) => {
    const result = await job.run(m, dryRun, input);
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
