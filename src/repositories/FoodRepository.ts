import FoodEntity from "@/entities/FoodEntity";
import { AppDataSource } from "@/services/database/datasource";

const FoodRepository = AppDataSource.getRepository(FoodEntity);

// export const FoodRepository = AppDataSource.getRepository(Food).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("groceryFood")
//             .where("groceryFood.title = :title", { title })
//             .getMany()
//     },
// })

export default FoodRepository;
