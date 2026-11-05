import createFrequency from "@/api/frequencies/services/createFrequency";
import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import FoodEntity from "@/entities/FoodEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import removeFrequency from "./removeFrequency";

const updateFrequencies = async (
  frequencies: {
    previousFoodId?: FoodEntity["id"];
    currentFoodId: FoodEntity["id"];
  },
  manager?: EntityManager,
) => {
  const m = findManager(FrequencyRepository, manager);
  const { previousFoodId, currentFoodId } = frequencies;

  if (!previousFoodId || Number(previousFoodId) === Number(currentFoodId)) {
    return;
  }

  const currentFood = await m.findOne(FoodEntity, {
    where: { id: currentFoodId },
    relations: ["household"],
  });

  if (!currentFood) {
    throw ServiceError("Food not found");
  }

  const previousFood = await m.findOne(FoodEntity, {
    where: {
      id: Number(previousFoodId),
      household: { id: currentFood.household.id },
    },
    relations: ["household"],
  });

  if (!previousFood) {
    return;
  }

  const allPreviousFoodFrequencies = await findAllFrequencies(
    {
      where: { food: { id: previousFood.id } },
    },
    m,
  );

  if (allPreviousFoodFrequencies.length > 99) {
    const toTrimFrequencies = allPreviousFoodFrequencies.slice(
      0,
      allPreviousFoodFrequencies.length - 99,
    );

    for (const f of toTrimFrequencies) {
      await removeFrequency({ id: f.id }, m);
    }
  }

  await createFrequency(
    {
      food: previousFood,
      nextBoughtFood: currentFood,
    },
    m,
  );
};
export default updateFrequencies;
