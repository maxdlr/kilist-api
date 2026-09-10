import FoodEntity from "@/entities/FoodEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";

const createFrequency = async (foods: {
  food: FoodEntity;
  nextCheckFood: FoodEntity;
}) => {
  const createdFrequency = await FrequencyRepository.save({
    food: foods.food,
    nextCheckFood: foods.nextCheckFood,
  });
  const frequency = await FrequencyRepository.save(createdFrequency);
  return frequency;
};
export default createFrequency;
