import switchHouseholdService from "@/api/households/services/switchHousehold";
import notifyHousehold from "@/api/notifications/services/notifyHousehold";
import { Request, Response } from "express";
import { visibleJoinCode } from "../helpers";

/**
 * Moves the authenticated user to a different household - either joining an
 * existing one via its join code, or creating a new one. Expects a
 * householdChoice body: { householdChoice: "join", joinCode } or
 * { householdChoice: "create", householdName? }.
 */
const switchHousehold = async (
  { user, body }: Request,
  res: Response,
): Promise<Response> => {
  if (!user) {
    throw Unauthorized("user");
  }

  const previousId = user.household.id;
  const household = await switchHouseholdService(user.id, body);

  await notifyHousehold("memberLeft", previousId, user).catch(() => 0);
  if (body?.householdChoice === "join") {
    await notifyHousehold("memberJoined", household.id, user).catch(() => 0);
  }

  return res.status(200).send({
    id: household.id,
    name: household.name,
    joinCode: visibleJoinCode(user, household),
  });
};

export default switchHousehold;
