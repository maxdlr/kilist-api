import findHouseholdMembers from "@/api/households/services/findHouseholdMembers";
import { Request, Response } from "express";
import { visibleJoinCode } from "../helpers";

/**
 * Returns the authenticated user's household along with its members.
 */
const readHousehold = async (
  { user }: Request,
  res: Response,
): Promise<Response> => {
  if (!user) {
    throw Unauthorized("user");
  }

  const household = user.household;
  const members = await findHouseholdMembers(household.id);

  return res.status(200).send({
    id: household.id,
    name: household.name,
    joinCode: visibleJoinCode(user, household),
    eaterProfiles: household.eaterProfiles ?? [],
    members: members.map((m) => ({
      id: m.id,
      username: m.username,
      type: m.type,
    })),
  });
};

export default readHousehold;
