import InstallStatEntity from "@/entities/InstallStatEntity";
import InstallStatRepository from "@/repositories/InstallStatRepository";
import findManager from "@/utils/findManager";
import { EntityManager, LessThan } from "typeorm";
import { InstallStatInput, RETENTION_DAYS } from "../helpers";

const recordInstallStats = async (entries: InstallStatInput[], manager?: EntityManager) => {
  const m = findManager(InstallStatRepository, manager);
  if (entries.length > 0) {
    await m.upsert(InstallStatEntity, entries, ["installId", "day"]);
  }
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 3600000).toISOString().slice(0, 10);
  await m.delete(InstallStatEntity, { day: LessThan(cutoff) });
  return entries.length;
};

export default recordInstallStats;
