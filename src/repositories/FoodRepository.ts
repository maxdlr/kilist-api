import FoodEntity from "@/entities/FoodEntity";
import { AppDataSource } from "@/services/database/datasource";

const FoodRepository = AppDataSource.getRepository(FoodEntity);

export default FoodRepository;
