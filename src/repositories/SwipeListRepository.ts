import SwipeListEntity from "@/entities/SwipeListEntity";
import { AppDataSource } from "@/services/database/datasource";

const SwipeListRepository = AppDataSource.getRepository(SwipeListEntity);

export default SwipeListRepository;
