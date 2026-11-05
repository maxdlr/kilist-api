import AdminJobRunEntity from "@/entities/AdminJobRunEntity";
import { AppDataSource } from "@/services/database/datasource";

const AdminJobRunRepository = AppDataSource.getRepository(AdminJobRunEntity);

export default AdminJobRunRepository;
