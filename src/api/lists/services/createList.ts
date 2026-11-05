import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import findManager from "@/utils/findManager";
import validateCrudPayload from "@/services/validateCrudPayload";
import { EntityManager } from "typeorm";

/**
 * Creates a list for a household.
 *
 * @param householdId - The household the list belongs to
 * @param data - List title/description and whether it is the household's main list
 * @param manager - Optional entity manager for transaction support
 * @returns The newly created list
 */
const createList = async (
  householdId: number,
  data: { title?: string; description?: string; isMain?: boolean },
  manager?: EntityManager,
): Promise<ListEntity> => {
  const m = findManager(ListRepository, manager);

  const list = new ListEntity();
  list.title = data.title ?? "My list";
  list.description = data.description;
  list.isMain = data.isMain ?? false;
  list.household = { id: householdId } as HouseholdEntity;
  list.foods = [];

  await validateCrudPayload(list);

  return await m.save(ListEntity, list);
};

export default createList;
