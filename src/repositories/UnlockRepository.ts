import UnlockEntity from "@/entities/UnlockEntity";
import { AppDataSource } from "@/services/database/datasource";

const UnlockRepository = AppDataSource.getRepository(UnlockEntity);

export default UnlockRepository;
