import switchHouseholdService from "@/api/households/services/switchHousehold";
import { Request, Response } from "express";

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

  const household = await switchHouseholdService(user.id, body);

  return res.status(200).send({
    id: household.id,
    name: household.name,
    joinCode: household.joinCode,
  });
};

export default switchHousehold;
