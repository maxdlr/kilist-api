import SwipeListEntity from "@/entities/SwipeListEntity";
import { AppDataSource } from "@/services/database/datasource";

const swipeListRepository = AppDataSource.getRepository(SwipeListEntity);

export default swipeListRepository;
