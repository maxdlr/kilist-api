import { RULES } from "@/api/catalog/rules";
import findFoodIcon from "@/api/food-bank/findFoodIcon";
import { foodKeyOf } from "@/api/food-bank/foodBank";
import findList from "@/api/lists/services/findList";
import FoodEntity from "@/entities/FoodEntity";
import ListEntity from "@/entities/ListEntity";
import { EntityManager } from "typeorm";
import { cleanNote, cleanQuantity, productChanges, ScannedProduct } from "../helpers";
import createFood from "./createFood";
import { cleanFrequencyDays } from "../scoring";

const ONBOARDING_IN_STOCK_SCORE = RULES.swipe.onboardingScore;

const withDetails = (
  changes: Partial<FoodEntity>,
  data: { frequencyDays?: unknown; note?: unknown; quantity?: unknown },
): Partial<FoodEntity> => {
  const frequencyDays = cleanFrequencyDays(data.frequencyDays);
  const note = cleanNote(data.note);
  const quantity = cleanQuantity(data.quantity);
  return {
    ...changes,
    ...(frequencyDays && { frequencyDays }),
    ...(note && { note }),
    ...(quantity && { quantity }),
  };
};

const addOrMergeFood = async (
  householdId: number,
  listId: number,
  data: {
    name: string;
    note?: unknown;
    quantity?: unknown;
    fromOnboarding?: boolean;
    product?: ScannedProduct | null;
    frequencyDays?: unknown;
  },
  m: EntityManager,
): Promise<FoodEntity> => {
  if (!data.name) {
    throw ApiError("name is required");
  }

  const foods = await m.find(FoodEntity, {
    where: { household: { id: householdId } },
    order: { id: "ASC" },
  });
  const twin = foods.find((food) => foodKeyOf(food.name) === foodKeyOf(data.name));

  if (twin) {
    const list = await findList({ id: listId, household: { id: householdId } }, m);
    if (!list.foods.some((food) => food.id === twin.id)) {
      list.foods = [...list.foods, twin];
      await m.save(ListEntity, list);
    }
    const changes = withDetails(productChanges(twin, data.product), data);
    if (Object.keys(changes).length > 0) {
      await m.update(FoodEntity, twin.id, changes);
      Object.assign(twin, changes);
    }
    return twin;
  }

  const created = await createFood(
    householdId,
    listId,
    {
      name: data.name,
      ...(data.fromOnboarding === true && {
        inStockScore: ONBOARDING_IN_STOCK_SCORE,
        icon: findFoodIcon(data.name),
      }),
    },
    m,
  );
  const changes = withDetails(productChanges(created, data.product), data);
  if (Object.keys(changes).length > 0) {
    await m.update(FoodEntity, created.id, changes);
    Object.assign(created, changes);
  }

  return created;
};

export default addOrMergeFood;
