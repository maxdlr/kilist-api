import { EntityManager } from "typeorm";

export type AdminJobResult = {
  affected: number;
  summary: string;
};

export type AdminJobField =
  | { name: string; label: string; kind: "choice"; options: { value: string; label: string }[] }
  | { name: string; label: string; kind: "email" };

export type AdminJobInput = Record<string, string>;

export type AdminJob = {
  id: string;
  title: string;
  description: string;
  fields?: AdminJobField[];
  run: (m: EntityManager, dryRun: boolean, input: AdminJobInput) => Promise<AdminJobResult>;
};
