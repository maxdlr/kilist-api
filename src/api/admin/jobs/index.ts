import { giftSkin } from "./giftSkin";
import { switchToDefaultSkin } from "./skinJobs";
import { AdminJob } from "./types";

export const ADMIN_JOBS: AdminJob[] = [giftSkin, switchToDefaultSkin];

export const findAdminJob = (id: string) =>
  ADMIN_JOBS.find((job) => job.id === id);
