import HouseholdEntity from "@/entities/HouseholdEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const renameHousehold = async (
  householdId: number,
  name: string,
  manager?: EntityManager,
) => {
  const m = findManager(HouseholdRepository, manager);
  await m.update(HouseholdEntity, householdId, { name });
};

export default renameHousehold;
