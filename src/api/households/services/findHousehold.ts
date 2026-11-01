import HouseholdEntity from "@/entities/HouseholdEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";

/**
 * Finds a single household matching the given filter.
 *
 * @param where - Filter to locate the household (e.g. by id or joinCode)
 * @param manager - Optional entity manager for transaction support
 * @returns The matching household, or null if not found
 */
const findHousehold = async (
  where: FindOptionsWhere<HouseholdEntity>,
  manager?: EntityManager,
): Promise<HouseholdEntity | null> => {
  const m = findManager(HouseholdRepository, manager);

  const household = await m.findOne(HouseholdEntity, { where });

  return household;
};

export default findHousehold;
