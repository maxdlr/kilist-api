import { AppDataSource } from "@/services/database/datasource";
import { EntityManager } from "typeorm";

const doTransaction = async (
  transaction: (manager: EntityManager) => Promise<void>,
) => {
  return await AppDataSource.manager.transaction(transaction);
};

export default doTransaction;
