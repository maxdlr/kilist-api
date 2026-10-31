import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import { AppDataSource } from "@/services/database/datasource";

const FoodHistoryRepository = AppDataSource.getRepository(FoodHistoryEntity);

export default FoodHistoryRepository;
