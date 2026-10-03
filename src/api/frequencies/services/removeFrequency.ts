import FrequencyEntity from "@/entities/FrequencyEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import findManager from "@/utils/findManager";
import { EntityManager, FindOptionsWhere } from "typeorm";
import findFrequency from "./findFrequency";

const removeFrequency = async (
  where: FindOptionsWhere<FrequencyEntity>,
  manager?: EntityManager,
) => {
  const m = findManager(FrequencyRepository, manager);

  const foundFrequency = await findFrequency(where, m);

  if (!foundFrequency) {
    throw ServiceError("Frequency not found");
  }

  await m.delete(FrequencyEntity, foundFrequency.id);
};

export default removeFrequency;
