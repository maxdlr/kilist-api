import NewsEntity from "@/entities/NewsEntity";
import { AppDataSource } from "@/services/database/datasource";

const NewsRepository = AppDataSource.getRepository(NewsEntity);

export default NewsRepository;
