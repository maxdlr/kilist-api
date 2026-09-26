import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const getMostLikelyNextFoods = async (
  foodId: number,
  count: number = 1,
  manager?: EntityManager,
): Promise<number[] | null> => {
  const m = findManager(FoodRepository, manager);

  if (!foodId) {
    return null;
  }

  const frequencies = await findAllFrequencies(
    {
      where: { food: { id: foodId } },
      loadRelationIds: false,
    },
    m,
  );

  if (frequencies.length === 0) {
    return null;
  }

  const frequencyMap: Record<number, number> = {};

  frequencies.forEach((frequency) => {
    const nextFoodId = frequency.nextCheckFood.id;
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
