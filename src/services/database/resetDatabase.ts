import { AppDataSource } from "@/services/database/datasource";

export default async function resetDatabase(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // FK checks disabled: truncation order isn't guaranteed to respect entity relations
    await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const entity of AppDataSource.entityMetadatas) {
      await queryRunner.query(`TRUNCATE TABLE \`${entity.tableName}\``);
    }
    await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1");
  } finally {
    await queryRunner.release();
  }
}
