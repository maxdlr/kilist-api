import SessionEntity from "@/entities/SessionEntity";
import { AppDataSource } from "@/services/database/datasource";

const SessionRepository = AppDataSource.getRepository(SessionEntity);

// export const SessionRepository = AppDataSource.getRepository(Session).extend({
//     findByTitle(title: string) {
//         return this.createQueryBuilder("session")
//             .where("session.title = :title", { title })
//             .getMany()
//     },
// })

export default SessionRepository;
