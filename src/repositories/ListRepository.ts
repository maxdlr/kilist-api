import ListEntity from "@/entities/ListEntity";
import { AppDataSource } from "@/services/database/datasource";

const ListRepository = AppDataSource.getRepository(ListEntity);

export default ListRepository;
