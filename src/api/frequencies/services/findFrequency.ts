import FrequencyEntity from "@/entities/FrequencyEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";

const findFrequency = async (
  where: FindOptionsWhere<FrequencyEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(FrequencyRepository, manager);
  const frequency = await m.findOne(FrequencyEntity, { where });
  return frequency;
};

export default findFrequency;
