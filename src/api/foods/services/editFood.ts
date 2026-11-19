import { cleanAisle } from "@/api/food-bank/aisles";
import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import validateCrudPayload from "@/services/validateCrudPayload";
import { EntityManager } from "typeorm";
import findFood from "./findFood";
import { cleanFrequencyDays } from "../scoring";
import { cleanNote, cleanQuantity } from "../helpers";
import updateFoodInStockScore from "./updateFoodInStockScore";

/**
 * Edits a food's general details (name, note, quantity, aisle, frequency) within a household.
 *
 * @param householdId - The household the food must belong to
 * @param foodId - The food to edit
 * @param data - Partial name/note/quantity/aisle/frequencyDays updates; invalid values are ignored, null clears note, quantity and frequency
 * @param manager - Optional entity manager for transaction support
 * @returns The updated food
 */
const editFood = async (
  householdId: number,
  foodId: number,
  data: { name?: string; note?: unknown; quantity?: unknown; aisle?: unknown; frequencyDays?: unknown },
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

  if (data.name !== undefined) food.name = data.name;

  const note = cleanNote(data.note);
  if (note !== undefined) food.note = note;

  const quantity = cleanQuantity(data.quantity);
  if (quantity !== undefined) food.quantity = quantity;

  const aisle = cleanAisle(data.aisle);
  if (aisle) food.aisle = aisle;

  const frequencyDays = cleanFrequencyDays(data.frequencyDays);
  if (frequencyDays !== undefined) food.frequencyDays = frequencyDays;

  await validateCrudPayload(food);

  const saved = await m.save(FoodEntity, food);

  if (frequencyDays !== undefined || quantity !== undefined) {
    await updateFoodInStockScore(foodId, m);
    saved.inStockScore = (await m.findOneByOrFail(FoodEntity, { id: foodId })).inStockScore;
  }

  return saved;
};

export default editFood;
