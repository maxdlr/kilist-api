import EmailLogEntity from "@/entities/EmailLogEntity";
import { AppDataSource } from "@/services/database/datasource";

const EmailLogRepository = AppDataSource.getRepository(EmailLogEntity);

export default EmailLogRepository;
