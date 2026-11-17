import { cleanAisle } from "@/api/food-bank/aisles";
import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import validateCrudPayload from "@/services/validateCrudPayload";
import { EntityManager } from "typeorm";
import findFood from "./findFood";

const EDITABLE_FIELDS = ["name", "description"] as const;

/**
 * Edits a food's general details (name, description, aisle) within a household.
 *
 * @param householdId - The household the food must belong to
 * @param foodId - The food to edit
 * @param data - Partial name/description/aisle updates; an unknown aisle is ignored
 * @param manager - Optional entity manager for transaction support
 * @returns The updated food
 */
const editFood = async (
  householdId: number,
  foodId: number,
  data: Partial<Pick<FoodEntity, "name" | "description">> & { aisle?: unknown },
  manager?: EntityManager,
): Promise<FoodEntity> => {
  const m = findManager(FoodRepository, manager);

  const food = await findFood(
    { id: foodId, household: { id: householdId } },
    m,
  );

  if (!food) {
    throw Missing(`Food with id ${foodId} not found`);
  }

  for (const field of EDITABLE_FIELDS) {
    if (data[field] !== undefined) {
      food[field] = data[field] as string;
    }
  }

  const aisle = cleanAisle(data.aisle);
  if (aisle) food.aisle = aisle;

  await validateCrudPayload(food);

  return await m.save(FoodEntity, food);
};

export default editFood;
