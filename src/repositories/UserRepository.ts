import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";

const UserRepository = AppDataSource.getRepository(UserEntity);

// export const UserRepository = AppDataSource.getRepository(User).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("user")
//             .where("user.title = :title", { title })
//             .getMany()
//     },
// })

export default UserRepository;
