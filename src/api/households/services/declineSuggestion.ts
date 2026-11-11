import HouseholdEntity from "@/entities/HouseholdEntity";
import HouseholdRepository from "@/repositories/HouseholdRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import { MAX_DECLINED, suggestionKey } from "../helpers";

const declineSuggestion = async (householdId: number, name: unknown, at: Date, manager?: EntityManager) => {
  if (typeof name !== "string" || !name.trim()) throw ApiError("name is required");
  const m = findManager(HouseholdRepository, manager);
  const household = await m.findOne(HouseholdEntity, { where: { id: householdId } });
  if (!household) throw Missing("Cannot find household");
  const declined = { ...(household.declinedSuggestions ?? {}) };
  const key = suggestionKey(name);
  const previous = declined[key];
  if (previous && Date.parse(previous.at) >= at.getTime()) return;
  declined[key] = { at: at.toISOString(), count: (previous?.count ?? 0) + 1 };
  const kept = Object.entries(declined)
    .sort(([, a], [, b]) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, MAX_DECLINED);
  await m.update(HouseholdEntity, householdId, { declinedSuggestions: Object.fromEntries(kept) });
};

export default declineSuggestion;
