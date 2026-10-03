import findFood from "@/api/foods/services/findFood";
import createFrequency from "@/api/frequencies/services/createFrequency";
import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import FoodEntity from "@/entities/FoodEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";
import removeFrequency from "./removeFrequency";

const updateFrequencies = async (
  frequencies: {
    previousFoodId: FoodEntity["id"];
    currentFoodId: FoodEntity["id"];
  },
  manager?: EntityManager,
) => {
  const m = findManager(FrequencyRepository, manager);

  const previousFood = await findFood({ id: frequencies.previousFoodId }, m);
  const currentFood = await findFood({ id: frequencies.currentFoodId }, m);

  if (!currentFood) {
    throw ServiceError("Food not found");
  }

  const allPreviousFoodFrequencies = await findAllFrequencies(
    {
      where: { food: { id: previousFood?.id } },
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

    if (previousFood) {
      await createFrequency(
        {
          food: previousFood,
          nextBoughtFood: currentFood,
        },
        m,
      );
    }
  }
};
export default updateFrequencies;
