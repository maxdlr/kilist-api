import FrequencyEntity from "@/entities/FrequencyEntity";
import { AppDataSource } from "@/services/database/datasource";

const FrequencyRepository = AppDataSource.getRepository(FrequencyEntity);

export default FrequencyRepository;
