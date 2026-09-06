import FrequencyEntity from "@/entities/FrequencyEntity";
import { AppDataSource } from "@/services/database/datasource";

const FrequencyRepository = AppDataSource.getRepository(FrequencyEntity);

// export const FrequencyRepository = AppDataSource.getRepository(Frequency).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("frequency")
//             .where("frequency.title = :title", { title })
//             .getMany()
//     },
// })

export default FrequencyRepository;
