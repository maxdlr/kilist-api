import findFood from "@/api/foods/services/findFood";
import createFrequency from "@/api/frequencies/services/createFrequency";
import findAllFrequencies from "@/api/frequencies/services/findAllFrequencies";
import FoodEntity from "@/entities/FoodEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";

const updateFrequencies = async ({
  previous,
  current,
}: {
  previous: FoodEntity["id"];
  current: FoodEntity["id"];
}) => {
  const previousFood = await findFood({ id: previous });
  const currentFood = await findFood({ id: current });

  if (!previousFood || !currentFood) {
    throw ServiceError("Food not found");
  }

  const allPreviousFoodFrequencies = await findAllFrequencies({
    where: { food: { id: previousFood.id } },
  });

  if (allPreviousFoodFrequencies.length > 99) {
    const toTrimFrequencies = allPreviousFoodFrequencies.slice(
      0,
      allPreviousFoodFrequencies.length - 99,
    );

    await Promise.all(
      toTrimFrequencies.map(async (f) => {
        await FrequencyRepository.delete(f.id);
      }),
    );

    await createFrequency({
      food: previousFood,
      nextCheckFood: currentFood,
    });
  }
};
export default updateFrequencies;
