import createUser from "@/api/users/services/createUser";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import RaceEntity from "@/entities/RaceEntity";
import ShopListEntity, { ShopListStatus } from "@/entities/ShopListEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import RaceRepository from "@/repositories/RaceRepository";
import ShopListRepository from "@/repositories/ShopListRepository";
import { AppDataSource } from "@/services/database/datasource";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { answerRace, raceView } from "../services/race";
import { houseVotes, shopRecords } from "../services/shop";
import { meStats, standings } from "../services/stats";

let me: UserEntity;
let sam: UserEntity;
let foods: FoodEntity[];

const join = (username: string, joinCode: string) =>
  createUser({
    username,
    email: `${username}@example.com`,
    password: "Str0ng!Passw0rd",
    householdChoice: "join",
    joinCode,
  });

const playAll = async (
  user: UserEntity,
  answers: ("in" | "out" | "up")[],
  ms = 1000,
) => {
  const view = await raceView(user, 0);
  let last;
  for (const [index, food] of view.foods.entries()) {
    last = await answerRace(user, view.raceId!, {
      foodId: food.id,
      answer: answers[index % answers.length],
      ms,
    });
  }
  return { view, last: last! };
};

beforeEach(async () => {
  me = await createUser({
    username: "maxime",
    email: "maxime@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  sam = await join("sam", me.household.joinCode);
  foods = await FoodRepository.save(
    Array.from({ length: 12 }, (_, i) =>
      FoodRepository.create({
        name: `Food ${i}`,
        inStockScore: 0.2,
        household: me.household,
      }),
    ),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("versus race", () => {
  it("gives every member the same ten foods for the day", async () => {
    const mine = await raceView(me, 0);
    const theirs = await raceView(sam, 0);

    expect(mine.foods).toHaveLength(10);
    expect(theirs.raceId).toBe(mine.raceId);
    expect(theirs.foods.map((food) => food.id)).toEqual(mine.foods.map((food) => food.id));
  });

  it("keeps the race foods after someone has swiped them", async () => {
    const { view } = await playAll(me, ["out"]);
    const later = await raceView(sam, 0);

    expect(later.foods.map((food) => food.id)).toEqual(view.foods.map((food) => food.id));
  });

  it("records the answer with its author and finishes the run", async () => {
    const { view, last } = await playAll(me, ["out", "in"], 1500);

    expect(last.finished).toBe(true);
    expect(last.totalMs).toBe(15000);
    const histories = await AppDataSource.manager.find(FoodHistoryEntity, {
      where: { food: { id: view.foods[0]!.id } },
      relations: { user: true },
    });
    expect(histories.map((history) => history.user?.id)).toEqual([me.id]);
  });

  it("pays tickets for each fresh answer only", async () => {
    const view = await raceView(me, 0);
    const food = view.foods[0]!;
    const first = await answerRace(me, view.raceId!, { foodId: food.id, answer: "in", ms: 900 });
    const again = await answerRace(me, view.raceId!, { foodId: food.id, answer: "out", ms: 900 });

    expect(first.reward.earned).toBeGreaterThan(0);
    expect(again.reward.earned).toBe(0);
  });

  it("reveals the mate's answer and the verdict", async () => {
    await playAll(sam, ["in"]);
    const view = await raceView(me, 0);
    const result = await answerRace(me, view.raceId!, {
      foodId: view.foods[0]!.id,
      answer: "out",
      ms: 800,
    });

    expect(result.mates).toEqual([
      expect.objectContaining({ userId: sam.id, answer: "in" }),
    ]);
    expect(result.verdict).toEqual({ result: "tied", out: 1, in: 1 });
  });

  it("sets the fastest mate as the pace target", async () => {
    await playAll(sam, ["in"], 2000);
    const view = await raceView(me, 0);

    expect(view.target).toEqual(
      expect.objectContaining({ kind: "mate", userId: sam.id, totalMs: 20000 }),
    );
    expect(view.target?.splits[0]).toBe(2000);
  });

  it("rejects a food that is not in the race", async () => {
    const view = await raceView(me, 0);
    const outsider = foods.find((food) => !view.foods.some((entry) => entry.id === food.id))!;

    await expect(
      answerRace(me, view.raceId!, { foodId: outsider.id, answer: "in", ms: 100 }),
    ).rejects.toThrow("not in the race");
  });

  it("refuses answers after the run is finished", async () => {
    const { view } = await playAll(me, ["in"]);
    const extra = await AppDataSource.manager.findOneByOrFail(RaceEntity, { id: view.raceId! });

    await expect(
      answerRace(me, extra.id, { foodId: view.foods[0]!.id, answer: "in", ms: 100 }),
    ).rejects.toThrow("already finished");
  });
});

describe("versus solo", () => {
  it("races your own best run when you are alone", async () => {
    const solo = await createUser({
      username: "solo",
      email: "solo@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });
    await FoodRepository.save(
      Array.from({ length: 10 }, (_, i) =>
        FoodRepository.create({ name: `Solo ${i}`, inStockScore: 0.2, household: solo.household }),
      ),
    );
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-10T10:00:00Z"));
    await playAll(solo, ["out"], 1200);

    vi.setSystemTime(new Date("2026-03-12T10:00:00Z"));
    const view = await raceView(solo, 0);

    expect(view.target).toEqual(expect.objectContaining({ kind: "best", totalMs: 12000 }));
    expect(Object.keys(view.previousAnswers).length).toBeGreaterThan(0);
  });
});

describe("versus standings", () => {
  it("counts the faster finisher as the winner", async () => {
    await playAll(me, ["out"], 1000);
    await playAll(sam, ["in"], 2000);

    const table = await standings(me, 0, "week");
    const mine = table.members.find((row) => row.userId === me.id)!;
    const theirs = table.members.find((row) => row.userId === sam.id)!;

    expect(mine.wins).toBe(1);
    expect(theirs.wins).toBe(0);
    expect(table.today.every((row) => row.played)).toBe(true);
    expect(table.lastClash).not.toBeNull();
  });

  it("tracks head to head clashes and personal bests", async () => {
    await playAll(me, ["out"], 1000);
    await playAll(sam, ["in"], 2000);

    const stats = await meStats(me, 0);

    expect(stats.headToHead).toEqual([
      expect.objectContaining({ userId: sam.id, wins: 1, losses: 0, clashes: 10 }),
    ]);
    expect(stats.personal.bestRaceMs).toBe(10000);
    expect(stats.personal.streak).toBe(1);
  });

  it("shows each member's latest vote per food", async () => {
    const { view } = await playAll(me, ["out"]);
    const { votes } = await houseVotes(me);

    expect(votes[view.foods[0]!.id]?.[me.id]?.answer).toBe("out");
  });
});

describe("versus shop", () => {
  const shop = (user: UserEntity, bought: FoodEntity[], minutes: number) =>
    ShopListRepository.save(
      ShopListRepository.create({
        household: me.household,
        user,
        boughtFoods: bought,
        startFoods: bought,
        status: ShopListStatus.COMPLETED,
        createdAt: new Date("2026-03-10T10:00:00Z"),
        endedAt: new Date(Date.parse("2026-03-10T10:00:00Z") + minutes * 60000),
        buyLog: bought.map((food, index) => ({
          foodId: food.id,
          at: new Date(Date.parse("2026-03-10T10:00:00Z") + (index + 1) * 60000).toISOString(),
        })),
      } as Partial<ShopListEntity>),
    );

  it("finds the house record and your best run", async () => {
    await shop(sam, [foods[0]!, foods[1]!], 9);
    await shop(me, [foods[0]!], 12);

    const records = await shopRecords(me);

    expect(records.houseRecord).toEqual(expect.objectContaining({ userId: sam.id, ms: 540000 }));
    expect(records.myBest?.ms).toBe(720000);
    expect(records.houseRecord?.splits).toEqual([60000, 120000]);
  });
});

describe("versus race creation", () => {
  it("returns no race when nothing needs checking", async () => {
    await FoodRepository.update({ household: { id: me.household.id } }, { inStockScore: 1 });

    const view = await raceView(me, 0);

    expect(view.raceId).toBeNull();
    expect(view.foods).toEqual([]);
    expect(await RaceRepository.count()).toBe(0);
  });
});
