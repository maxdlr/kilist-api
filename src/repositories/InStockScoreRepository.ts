import InStockScoreEntity from "@/entities/InStockScoreEntity";
import { AppDataSource } from "@/services/database/datasource";

const InStockScoreRepository = AppDataSource.getRepository(InStockScoreEntity);

// export const InStockScoreRepository = AppDataSource.getRepository(InStockScore).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("inStockScore")
//             .where("inStockScore.title = :title", { title })
//             .getMany()
//     },
// })

export default InStockScoreRepository;
