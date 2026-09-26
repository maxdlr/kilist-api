import FrequencyEntity from "@/entities/FrequencyEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindManyOptions } from "typeorm";

const findAllFrequencies = async (
  options: FindManyOptions<FrequencyEntity> = {},
  manager?: EntityManager,
) => {
  const m = findManager(FrequencyRepository, manager);

  const frequencies = await m.find(FrequencyEntity, {
    loadRelationIds: true,
    order: { createdAt: "ASC" },
    relations: ["food", "nextCheckFood"],
    ...options,
  });

  return frequencies;
};

export default findAllFrequencies;
