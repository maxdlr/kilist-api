import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import { AppDataSource } from "@/services/database/datasource";

const RefreshTokenRepository = AppDataSource.getRepository(RefreshTokenEntity);

// export const RefreshTokenRepository = AppDataSource.getRepository(RefreshToken).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("refreshToken")
//             .where("refreshToken.title = :title", { title })
//             .getMany()
//     },
// })

export default RefreshTokenRepository;
