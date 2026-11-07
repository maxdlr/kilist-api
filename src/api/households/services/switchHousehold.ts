import HouseholdEntity from "@/entities/HouseholdEntity";
import UserEntity from "@/entities/UserEntity";
import doTransaction from "@/utils/doTransaction";
import { EntityManager } from "typeorm";
import createHousehold from "./createHousehold";
import findHousehold from "./findHousehold";

export type HouseholdChoice =
  | { householdChoice: "join"; joinCode: string }
  | { householdChoice: "create"; householdName?: string };

const isValidHouseholdChoice = (
  input: unknown,
): input is HouseholdChoice => {
  if (typeof input !== "object" || input === null) return false;
  const candidate = input as Record<string, unknown>;

  if (candidate.householdChoice === "join") {
    return (
      typeof candidate.joinCode === "string" && candidate.joinCode.length > 0
    );
  }

  if (candidate.householdChoice === "create") {
    return (
      candidate.householdName === undefined ||
      typeof candidate.householdName === "string"
    );
  }

  return false;
};

const resolveHousehold = async (
  input: HouseholdChoice,
  manager: EntityManager,
): Promise<HouseholdEntity> => {
  if (input.householdChoice === "join") {
    const household = await findHousehold({ joinCode: input.joinCode }, manager);
    if (!household) {
      throw UserError(404, "household.codeNotFound");
    }
    return household;
  }

  return await createHousehold(input.householdName, manager);
};

/**
 * Moves an existing user to a different household - either by joining an
 * existing household via its join code, or by creating a new one. The user's
 * previous household is left untouched (it may become empty; empty households
 * are not deleted for now).
 *
 * @param userId - The user to move
 * @param choice - Whether to join an existing household or create a new one
 * @returns The user's new household
 */
const switchHousehold = async (
  userId: number,
  choice: unknown,
): Promise<HouseholdEntity> => {
  if (!isValidHouseholdChoice(choice)) {
    throw ApiError(
      400,
      'A valid householdChoice ("join" with joinCode, or "create") is required',
    );
  }

  return await doTransaction(async (m) => {
    const user = await m.findOne(UserEntity, {
      where: { id: userId },
      relations: ["household"],
    });
    if (!user) {
      throw Missing("Cannot find user");
    }

    const household = await resolveHousehold(choice, m);

    if (user.household?.id === household.id) {
      throw UserError(400, "household.alreadyMember");
    }

    user.household = household;
    await m.save(UserEntity, user);

    return household;
  });
};

export default switchHousehold;
