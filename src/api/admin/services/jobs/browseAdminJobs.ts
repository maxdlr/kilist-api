import AdminJobRunEntity from "@/entities/AdminJobRunEntity";
import AdminJobRunRepository from "@/repositories/AdminJobRunRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import { ADMIN_JOBS } from "../../jobs";

const browseAdminJobs = (manager?: EntityManager) => {
  const m = findManager(AdminJobRunRepository, manager);
  return Promise.all(
    ADMIN_JOBS.map(async ({ id, title, description, fields }) => {
      const lastRun = await m.findOne(AdminJobRunEntity, {
        where: { jobId: id },
        order: { createdAt: "DESC", id: "DESC" },
      });

      return {
        id,
        title,
        description,
        fields: fields ?? [],
        lastRun: lastRun && {
          dryRun: lastRun.dryRun,
          affected: lastRun.affected,
          summary: lastRun.summary,
          ranAt: lastRun.createdAt,
        },
      };
    }),
  );
};

export default browseAdminJobs;
