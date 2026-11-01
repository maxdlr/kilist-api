import HouseholdEntity from "@/entities/HouseholdEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import generateJoinCode from "@/utils/generateJoinCode";
import { EntityManager } from "typeorm";
import findHousehold from "./findHousehold";

// Retry a few times on the (very unlikely) chance of a joinCode collision
// rather than widening the code or adding complexity up front.
const MAX_JOIN_CODE_ATTEMPTS = 5;

/**
 * Creates a new household with a unique, randomly generated join code.
 *
 * @param name - Optional display name for the household
 * @param manager - Optional entity manager for transaction support
 * @returns The newly created household
 */
const createHousehold = async (
  name?: string,
  manager?: EntityManager,
): Promise<HouseholdEntity> => {
  const m = findManager(HouseholdRepository, manager);

  let joinCode = generateJoinCode();
  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt++) {
    const existing = await findHousehold({ joinCode }, m);
    if (!existing) break;
    joinCode = generateJoinCode();
  }

  const household = new HouseholdEntity();
  household.name = name;
  household.joinCode = joinCode;

  return await m.save(HouseholdEntity, household);
};

export default createHousehold;
