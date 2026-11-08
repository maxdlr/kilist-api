import doTransaction from "@/utils/doTransaction";
import { EntityManager } from "typeorm";

const inTransaction = <T>(
  manager: EntityManager | undefined,
  work: (m: EntityManager) => Promise<T>,
) =>
  manager?.queryRunner?.isTransactionActive ? work(manager) : doTransaction(work);

export default inTransaction;
