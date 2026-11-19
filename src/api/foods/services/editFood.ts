import { cleanAisle } from "@/api/food-bank/aisles";
import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import validateCrudPayload from "@/services/validateCrudPayload";
import { EntityManager } from "typeorm";
import findFood from "./findFood";
import { cleanFrequencyDays } from "../scoring";
import updateFoodInStockScore from "./updateFoodInStockScore";

const EDITABLE_FIELDS = ["name", "description"] as const;

/**
 * Edits a food's general details (name, description, aisle) within a household.
 *
 * @param householdId - The household the food must belong to
 * @param foodId - The food to edit
 * @param data - Partial name/description/aisle/frequencyDays updates; an unknown aisle or out-of-range frequency is ignored, a null frequency clears it
 * @param manager - Optional entity manager for transaction support
 * @returns The updated food
 */
const editFood = async (
  householdId: number,
  foodId: number,
  data: Partial<Pick<FoodEntity, "name" | "description">> & { aisle?: unknown; frequencyDays?: unknown },
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

  const frequencyDays = cleanFrequencyDays(data.frequencyDays);
  if (frequencyDays !== undefined) food.frequencyDays = frequencyDays;

  await validateCrudPayload(food);

  const saved = await m.save(FoodEntity, food);

  if (frequencyDays !== undefined) {
    await updateFoodInStockScore(foodId, m);
    saved.inStockScore = (await m.findOneByOrFail(FoodEntity, { id: foodId })).inStockScore;
  }

  return saved;
};

export default editFood;
