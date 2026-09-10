import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import { AppDataSource } from "@/services/database/datasource";

const FoodHistoryRepository = AppDataSource.getRepository(FoodHistoryEntity);

// export const InStockScoreRepository = AppDataSource.getRepository(InStockScore).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("inStockScore")
//             .where("inStockScore.title = :title", { title })
//             .getMany()
//     },
// })

export default FoodHistoryRepository;
