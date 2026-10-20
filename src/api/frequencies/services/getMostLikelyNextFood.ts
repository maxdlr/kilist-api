import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import findSession from "@/api/shop/services/findSession";
import FoodEntity from "@/entities/FoodEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager, In, IsNull, LessThan, Not, Or } from "typeorm";

const getMostLikelyNextFoods = async (
  foodId: number,
  count: number = 1,
  sessionId?: number,
  manager?: EntityManager,
): Promise<number[] | null> => {
  const m = findManager(FoodRepository, manager);

  if (!foodId) {
    return null;
  }

  const session = await findSession({ id: sessionId }, m);

  let availableFoodIds: number[] = [];

  if (session) {
    const boughtFoodIds: number[] =
      session.boughtFoods.map((f) => (f as FoodEntity).id) || [];
    const startFoodIds: number[] =
      session.startFoods.map((f) => (f as FoodEntity).id) || [];

    availableFoodIds = startFoodIds.filter((id) => !boughtFoodIds.includes(id));
  }

  const frequencies = await findAllFrequencies(
    {
      where: {
        food: { id: foodId },
        nextBoughtFood: {
          ...(availableFoodIds.length > 0 ? { id: In(availableFoodIds) } : {}),
          inStockScore: Not(1),
          snoozedUntil: Or(IsNull(), LessThan(new Date())),
        },
      },
    },
    m,
  );

  if (frequencies.length === 0) {
    return null;
  }

  const frequencyMap: Record<number, number> = {};

  frequencies.forEach((frequency) => {
    const nextFoodId: number = frequency.nextBoughtFood as number;
    if (nextFoodId) {
      frequencyMap[nextFoodId] = (frequencyMap[nextFoodId] || 0) + 1;
    }
  });

  const mostLikelyNextFoodIds = Object.keys(frequencyMap)
    .map(Number)
    .sort((a, b) => (frequencyMap[b] ?? 0) - (frequencyMap[a] ?? 0))
    .slice(0, count);

  return mostLikelyNextFoodIds;
};

export default getMostLikelyNextFoods;
