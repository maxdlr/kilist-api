import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import { AppDataSource } from "@/services/database/datasource";

const RefreshTokenRepository = AppDataSource.getRepository(RefreshTokenEntity);

export default RefreshTokenRepository;
