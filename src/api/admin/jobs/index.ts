import { switchToDefaultSkin } from "./skinJobs";
import { AdminJob } from "./types";

export const ADMIN_JOBS: AdminJob[] = [switchToDefaultSkin];

export const findAdminJob = (id: string) =>
  ADMIN_JOBS.find((job) => job.id === id);
