import { Request, Response } from "express";
import renameHousehold from "../services/renameHousehold";

export const HOUSEHOLD_NAME_MAX = 40;

const editHouseholdName = async ({ body, user }: Request, res: Response) => {
  if (!user) {
    throw Unauthorized("user");
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) throw UserError(400, "validation.name.required");
  if (name.length > HOUSEHOLD_NAME_MAX) throw UserError(400, "validation.name.long");

  await renameHousehold(user.household.id, name);

  return res.status(200).send({ id: user.household.id, name });
};

export default editHouseholdName;
