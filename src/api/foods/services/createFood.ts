import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import validateCrudPayload from "@/services/validateCrudPayload";
import { EntityManager } from "typeorm";
import findList from "@/api/lists/services/findList";

/**
 * Creates a food in the given household and attaches it to a list.
 *
 * @param householdId - The household the food belongs to
 * @param listId - The list to attach the new food to
 * @param data - The food's name and optional description
 * @param manager - Optional entity manager for transaction support
 * @returns The newly created food
 */
const createFood = async (
  householdId: number,
  listId: number,
  data: { name: string; description?: string },
  manager?: EntityManager,
): Promise<FoodEntity> => {
  const m = findManager(FoodRepository, manager);

  const list = await findList(
    { id: listId, household: { id: householdId } },
    m,
  );

  const food = new FoodEntity();
  food.name = data.name;
  food.description = data.description;
  food.household = { id: householdId } as FoodEntity["household"];
  food.lists = [list];

  await validateCrudPayload(food);

  return await m.save(FoodEntity, food);
};

export default createFood;
