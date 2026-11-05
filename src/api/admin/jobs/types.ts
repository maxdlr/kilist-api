import { EntityManager } from "typeorm";

export type AdminJobResult = {
  affected: number;
  summary: string;
};

export type AdminJob = {
  id: string;
  title: string;
  description: string;
  run: (m: EntityManager, dryRun: boolean) => Promise<AdminJobResult>;
};
