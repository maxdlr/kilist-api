import { adminStats } from "@/api/admin/services/stats";
import UserEntity from "@/entities/UserEntity";
import { AppDataSource } from "@/services/database/datasource";
import { describe, expect, it, vi } from "vitest";
import { makeFakeUsers } from "../fakeUsers";

describe("fake users fixture", () => {
  it("creates varied users the admin stats can read", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    await AppDataSource.manager.transaction((m) => makeFakeUsers(m));

    const users = await AppDataSource.manager.find(UserEntity);
    expect(users).toHaveLength(21);
    expect(new Set(users.map((user) => user.email)).size).toBe(21);

    const stats = await adminStats(30);
    expect(stats.growth.users).toBe(21);
    expect(stats.growth.households).toBe(11);
  });
});
