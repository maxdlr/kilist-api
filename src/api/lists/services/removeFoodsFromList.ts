import ListEntity from "@/entities/ListEntity";
import ListRepository from "@/repositories/ListRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import findList from "./findList";

/**
 * Detaches the given food ids from a list, without deleting the underlying
 * food entities — they remain in the household's broader inventory.
 *
 * @param householdId - The household the list must belong to
 * @param listId - The list to remove foods from
 * @param foodIds - The food ids to detach from the list
 * @param manager - Optional entity manager for transaction support
 * @returns The updated list
 */
const removeFoodsFromList = async (
  householdId: number,
  listId: number,
  foodIds: number[],
  manager?: EntityManager,
): Promise<ListEntity> => {
  const m = findManager(ListRepository, manager);

  const list = await findList(
    { id: listId, household: { id: householdId } },
    m,
  );

  list.foods = list.foods.filter((food) => !foodIds.includes(food.id));

  return await m.save(ListEntity, list);
};

export default removeFoodsFromList;
