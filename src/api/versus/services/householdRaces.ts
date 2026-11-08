import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity from "@/entities/RaceRunEntity";
import RaceRepository from "@/repositories/RaceRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In } from "typeorm";

const runsOf = (raceIds: number[], m: EntityManager) =>
  raceIds.length
    ? m.find(RaceRunEntity, {
        where: { race: { id: In(raceIds) } },
        relations: { user: true, race: true },
        order: { id: "ASC" },
      })
    : Promise.resolve([] as RaceRunEntity[]);

const householdRaces = async (householdId: number, manager?: EntityManager) => {
  const m = findManager(RaceRepository, manager);
  const races = await m.find(RaceEntity, {
    where: { household: { id: householdId } },
    order: { day: "ASC" },
  });
  const runs = await runsOf(races.map((race) => race.id), m);
  return races.map((race) => ({
    race,
    runs: runs.filter((run) => run.race.id === race.id),
  }));
};

export default householdRaces;
