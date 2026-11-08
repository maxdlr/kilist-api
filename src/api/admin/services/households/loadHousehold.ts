import HouseholdEntity from "@/entities/HouseholdEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const loadHousehold = async (id: number, manager?: EntityManager) => {
  const household = await findManager(HouseholdRepository, manager).findOne(HouseholdEntity, { where: { id } });
  if (!household) throw Missing(`Household ${id} not found`);
  return household;
};

export default loadHousehold;
