import FOOD_BANK from "@/api/food-bank/foodBank";
import findList from "@/api/lists/services/findList";
import { Request, Response } from "express";

/**
 * Returns food-bank suggestions for onboarding: the common catalogue minus
 * any item (matched by name, case-insensitive) already present in the user's
 * main list, so the deck shrinks as the user adds items.
 */
const browseFoodBank = async (
  { user }: Request,
  res: Response,
): Promise<Response> => {
  if (!user) {
    throw Unauthorized("user");
  }

  // Pre-existing accounts created before main lists were auto-provisioned may
  // not have one yet; in that case every bank item is a valid suggestion.
  const mainList = await findList({
    isMain: true,
    household: { id: user.household.id },
  }).catch(() => null);

  const existingNames = new Set(
    (mainList?.foods ?? []).map((food) => food.name.trim().toLowerCase()),
  );

  const suggestions = FOOD_BANK.filter(
    (item) => !existingNames.has(item.name.trim().toLowerCase()),
  );

  return res.status(200).send(suggestions);
};

export default browseFoodBank;
