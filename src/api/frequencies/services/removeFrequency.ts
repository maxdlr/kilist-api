import FrequencyEntity from "@/entities/FrequencyEntity";
import FrequencyRepository from "@/repositories/FrequencyRepository";
import { FindOptionsWhere } from "typeorm";

const deleteFrequency = async (where: FindOptionsWhere<FrequencyEntity>) => {
  const foundFrequency = await FrequencyRepository.findOne({
    where,
  });

  if (!foundFrequency) {
    throw ServiceError("Frequency not found");
  }

  await FrequencyRepository.delete(foundFrequency);
};
export default deleteFrequency;
