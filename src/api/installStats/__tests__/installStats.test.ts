import installStats from "@/api/admin/services/stats/installStats";
import InstallStatRepository from "@/repositories/InstallStatRepository";
import { describe, expect, it } from "vitest";
import { parseInstallStat } from "../helpers";
import recordInstallStats from "../services/recordInstallStats";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";
const day = (offset: number) => new Date(Date.now() - offset * 24 * 3600000).toISOString().slice(0, 10);

const entry = (installId: string, offset: number, extra: Record<string, unknown> = {}) =>
  parseInstallStat({ day: day(offset), appVersion: "0.1.0", platform: "android", guest: true, skin: "arcade", ...extra }, installId)!;

describe("anonymous install stats", () => {
  it("rejects malformed ids and days, and clamps counts", () => {
    expect(parseInstallStat({ day: day(0) }, "not an id")).toBeNull();
    expect(parseInstallStat({ day: "yesterday" }, ID_A)).toBeNull();
    expect(parseInstallStat({ day: day(0), rounds: -4, cards: 1e12 }, ID_A)).toMatchObject({ rounds: 0, cards: 100000 });
  });

  it("keeps one row per install and day, replacing it on resend", async () => {
    await recordInstallStats([entry(ID_A, 0, { rounds: 1 })]);
    await recordInstallStats([entry(ID_A, 0, { rounds: 2 })]);

    const rows = await InstallStatRepository.find();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.rounds).toBe(2);
  });

  it("drops rows older than the retention period", async () => {
    await recordInstallStats([entry(ID_A, 500), entry(ID_A, 0)]);

    expect(await InstallStatRepository.count()).toBe(1);
  });

  it("summarises the ten chosen stats", async () => {
    await recordInstallStats([
      entry(ID_A, 10, { rounds: 1, cards: 10, foods: 6 }),
      entry(ID_A, 9, { rounds: 1, cards: 8, runs: 1, suggestionsTaken: 2, foods: 8, gatesHousehold: 1 }),
      entry(ID_A, 0, { rounds: 1, cards: 6, foods: 10, guest: false, skin: "roast", signups: 1, signupsAfterGate: 1 }),
      entry(ID_B, 0, { rounds: 1, cards: 10, foods: 4, errors: 2, appVersion: "0.2.0" }),
    ]);

    const stats = await installStats(0);

    expect(stats.active).toEqual({ today: 2, week: 2, month: 2 });
    expect(stats.retention.day1).toEqual({ rate: 100, cohort: 1 });
    expect(stats.rounds).toBe(4);
    expect(stats.cardsPerRound).toBe(9);
    expect(stats.runs).toBe(1);
    expect(stats.suggestionsTaken).toBe(2);
    expect(stats.foodsPerInventory).toBe(10);
    expect(stats.skins.map((row) => row.name).sort()).toEqual(["arcade", "roast"]);
    expect(stats.guests).toEqual({ guest: 1, account: 1 });
    expect(stats.gates).toMatchObject({ household: 1, signupsAfterGate: 1, conversion: 100 });
    expect(stats.errors).toBe(2);
    expect(stats.versions.map((row) => row.name).sort()).toEqual(["0.1.0", "0.2.0"]);
  });
});
