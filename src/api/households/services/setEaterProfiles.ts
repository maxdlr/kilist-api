import { cleanProfiles } from "@/api/food-bank/profiles";
import HouseholdEntity from "@/entities/HouseholdEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const setEaterProfiles = async (householdId: number, profiles: unknown, manager?: EntityManager) => {
  const m = findManager(HouseholdRepository, manager);
  await m.update(HouseholdEntity, householdId, { eaterProfiles: cleanProfiles(profiles) });
};

export default setEaterProfiles;
