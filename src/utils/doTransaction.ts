import { AppDataSource } from "@/services/database/datasource";
import { EntityManager } from "typeorm";

const doTransaction = async <T>(
  transaction: (manager: EntityManager) => Promise<T>,
) => {
  return await AppDataSource.manager.transaction(transaction);
};

export default doTransaction;
