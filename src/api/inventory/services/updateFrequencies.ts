import findFood from "@/api/foods/services/findFood";
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

  await FrequencyRepository.save({
    food: previousFood,
    nextCheckFood: currentFood,
  });

  const allPreviousFoodFrequencies = await FrequencyRepository.find({
    where: { food: previousFood },
    order: { createdAt: "ASC" },
  });

  if (allPreviousFoodFrequencies.length > 100) {
    const oldestFrequency = allPreviousFoodFrequencies.reduce(
      (oldest, current) => {
        if (!oldest || !oldest.createdAt) return current;
        if (!current || !current.createdAt) return oldest;

        return current.createdAt < oldest.createdAt ? current : oldest;
      },
      allPreviousFoodFrequencies[0],
    );

    if (oldestFrequency) {
      await FrequencyRepository.delete(oldestFrequency.id);
    }
  }
};
export default updateFrequencies;
