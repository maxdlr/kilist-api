import ShopListEntity from "@/entities/ShopListEntity";
import { AppDataSource } from "@/services/database/datasource";

const ShopListRepository = AppDataSource.getRepository(ShopListEntity);

// export const SessionRepository = AppDataSource.getRepository(Session).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("session")
//             .where("session.title = :title", { title })
//             .getMany()
//     },
// })

export default ShopListRepository;
