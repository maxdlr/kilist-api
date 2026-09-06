import ListEntity from "@/entities/ListEntity";
import { AppDataSource } from "@/services/database/datasource";

const ListRepository = AppDataSource.getRepository(ListEntity);

// export const ListRepository = AppDataSource.getRepository(List).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("groceryList")
//             .where("groceryList.title = :title", { title })
//             .getMany()
//     },
// })

export default ListRepository;
