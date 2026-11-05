import ShopListEntity from "@/entities/ShopListEntity";
import { AppDataSource } from "@/services/database/datasource";

const ShopListRepository = AppDataSource.getRepository(ShopListEntity);

export default ShopListRepository;
