import { afterAll, afterEach, beforeAll } from "vitest";

// Redirects the shared AppDataSource to the test database (see docker-compose.yml /
// Makefile db-*-test targets) instead of the dev/prod one, so integration tests never
// touch real data.
process.env.DB_PORT = process.env.DB_TEST_PORT || "3320";
process.env.APP_NAME = `${process.env.APP_NAME || "kilist-api"}-test`;

// Dynamic import (inside the hooks, not top-level): AppDataSource reads process.env at
// module load time, so the env vars above must be set before this module loads.
beforeAll(async () => {
  const { AppDataSource } = await import("@/services/database/datasource");
  await AppDataSource.initialize();
});

afterEach(async () => {
  const { default: resetDatabase } =
    await import("@/services/database/resetDatabase");
  await resetDatabase();
});

afterAll(async () => {
  const { AppDataSource } = await import("@/services/database/datasource");
  await AppDataSource.destroy();
});
