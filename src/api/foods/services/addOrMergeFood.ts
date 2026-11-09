import findFoodIcon from "@/api/food-bank/findFoodIcon";
import findList from "@/api/lists/services/findList";
import FoodEntity from "@/entities/FoodEntity";
import ListEntity from "@/entities/ListEntity";
import { EntityManager } from "typeorm";
import createFood from "./createFood";

const ONBOARDING_IN_STOCK_SCORE = 0.5;

const normalize = (name: string) => name.trim().toLowerCase();

const addOrMergeFood = async (
  householdId: number,
  listId: number,
  data: { name: string; description?: string; fromOnboarding?: boolean },
  m: EntityManager,
): Promise<FoodEntity> => {
  if (!data.name) {
    throw ApiError("name is required");
  }

  const foods = await m.find(FoodEntity, {
    where: { household: { id: householdId } },
    order: { id: "ASC" },
  });
  const twin = foods.find((food) => normalize(food.name) === normalize(data.name));

  if (twin) {
    const list = await findList({ id: listId, household: { id: householdId } }, m);
    if (!list.foods.some((food) => food.id === twin.id)) {
      list.foods = [...list.foods, twin];
      await m.save(ListEntity, list);
    }
    return twin;
  }

  return createFood(
    householdId,
    listId,
    {
      name: data.name,
      description: data.description,
      ...(data.fromOnboarding === true && {
        inStockScore: ONBOARDING_IN_STOCK_SCORE,
        icon: findFoodIcon(data.name),
      }),
    },
    m,
  );
};

export default addOrMergeFood;
