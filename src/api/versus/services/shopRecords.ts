import UserEntity from "@/entities/UserEntity";
import { EntityManager } from "typeorm";
import shopRuns from "./shopRuns";

const shopRecords = async (user: UserEntity, manager?: EntityManager) => {
  const runs = await shopRuns(user.household.id, manager);
  const fastest = (list: typeof runs) =>
    list.reduce<(typeof runs)[number] | null>((best, run) => (!best || run.ms < best.ms ? run : best), null);
  const strip = (run: (typeof runs)[number] | null) =>
    run && {
      userId: run.userId,
      username: run.username,
      ms: run.ms,
      items: run.items,
      splits: run.splits,
      endedAt: run.endedAt,
    };

  return {
    houseRecord: strip(fastest(runs)),
    myBest: strip(fastest(runs.filter((run) => run.userId === user.id))),
    runsByMember: Object.fromEntries(
      [...new Set(runs.map((run) => run.userId))].map((id) => [id, runs.filter((run) => run.userId === id).length]),
    ),
  };
};

export default shopRecords;
