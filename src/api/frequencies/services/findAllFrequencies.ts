import FrequencyEntity from "@/entities/FrequencyEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import { FindManyOptions } from "typeorm";

const findAllFrequencies = async (
  options: FindManyOptions<FrequencyEntity> = {},
) => {
  const frequencies = await FrequencyRepository.find({
    where: {},
    loadRelationIds: true,
    order: { createdAt: "ASC" },
    relations: ["food", "nextCheckFood"],
    ...options,
  });

  return frequencies;
};

export default findAllFrequencies;
