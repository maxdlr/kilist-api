import HouseholdEntity from "@/entities/HouseholdEntity";
import { AppDataSource } from "@/services/database/datasource";

const HouseholdRepository = AppDataSource.getRepository(HouseholdEntity);

export default HouseholdRepository;
