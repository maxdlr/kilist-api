import InstallStatEntity from "@/entities/InstallStatEntity";
import { AppDataSource } from "@/services/database/datasource";

const InstallStatRepository = AppDataSource.getRepository(InstallStatEntity);

export default InstallStatRepository;
