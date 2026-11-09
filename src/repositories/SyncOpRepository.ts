import SyncOpEntity from "@/entities/SyncOpEntity";
import { AppDataSource } from "@/services/database/datasource";

const SyncOpRepository = AppDataSource.getRepository(SyncOpEntity);

export default SyncOpRepository;
