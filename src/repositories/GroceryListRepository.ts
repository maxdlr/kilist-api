import GroceryListEntity from "@/entities/GroceryListEntity";
import { AppDataSource } from "@/services/database/datasource";

const GroceryListRepository = AppDataSource.getRepository(GroceryListEntity);

// export const GroceryListRepository = AppDataSource.getRepository(GroceryList).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("groceryList")
//             .where("groceryList.title = :title", { title })
//             .getMany()
//     },
// })

export default GroceryListRepository;
