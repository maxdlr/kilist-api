import RaceEntity from "@/entities/RaceEntity";
import { AppDataSource } from "@/services/database/datasource";

const RaceRepository = AppDataSource.getRepository(RaceEntity);

export default RaceRepository;
