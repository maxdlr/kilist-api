import findFoodSwipes from "@/api/foods/services/findFoodSwipes";
import RaceEntity from "@/entities/RaceEntity";
import RaceRepository from "@/repositories/RaceRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import { isDuplicate } from "../helpers";

const RACE_SIZE = 10;

const getOrCreateRace = async (
  householdId: number,
  day: string,
  manager?: EntityManager,
): Promise<RaceEntity | null> => {
  const m = findManager(RaceRepository, manager);
  const where = { household: { id: householdId }, day };
  const existing = await m.findOne(RaceEntity, { where });
  if (existing) return existing;

  const foods = await findFoodSwipes(householdId, { take: RACE_SIZE }, m);
  if (foods.length === 0) return null;

  try {
    return await m.save(RaceEntity, {
      household: { id: householdId },
      day,
      foodIds: foods.map((food) => food.id),
    });
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    return m.findOne(RaceEntity, { where });
  }
};

export default getOrCreateRace;
