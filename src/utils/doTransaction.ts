import { AppDataSource } from "@/services/database/datasource";
import { EntityManager } from "typeorm";

const doTransaction = async <T>(
  transaction: (manager: EntityManager) => Promise<T>,
) => {
  try {
    return await AppDataSource.manager.transaction(transaction);
  } catch (error: any) {
    throw ApiError(
      500,
      error?.message || "An error occurred during the transaction",
    );
  }
};

export default doTransaction;
