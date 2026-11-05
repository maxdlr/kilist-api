import TicketEntryEntity from "@/entities/TicketEntryEntity";
import { AppDataSource } from "@/services/database/datasource";

const TicketEntryRepository = AppDataSource.getRepository(TicketEntryEntity);

export default TicketEntryRepository;
