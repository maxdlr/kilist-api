import RaceRunEntity from "@/entities/RaceRunEntity";
import { AppDataSource } from "@/services/database/datasource";

const RaceRunRepository = AppDataSource.getRepository(RaceRunEntity);

export default RaceRunRepository;
