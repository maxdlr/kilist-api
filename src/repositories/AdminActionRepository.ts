import AdminActionEntity from "@/entities/AdminActionEntity";
import { AppDataSource } from "@/services/database/datasource";

const AdminActionRepository = AppDataSource.getRepository(AdminActionEntity);

export default AdminActionRepository;
