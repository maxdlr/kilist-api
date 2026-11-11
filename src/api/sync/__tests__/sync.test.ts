import checkRefreshToken from "@/api/auth/services/checkRefreshToken";
import createRefreshToken from "@/api/auth/services/createRefreshToken";
import deliverJwtToken from "@/api/auth/services/deliverJwtToken";
import revokeAllRefreshTokenByUserId from "@/api/auth/services/revokeAllRefreshTokenByUserId";
import rotateRefreshToken from "@/api/auth/services/rotateRefreshToken";
import ticketBalance from "@/api/prizes/services/ticketBalance";
import findShopList from "@/api/shop-list/services/findShopList";
import getSwipeGame from "@/api/swipe-list/services/getSwipeGame";
import createUser from "@/api/users/services/createUser";
import getOrCreateRace from "@/api/versus/services/getOrCreateRace";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity from "@/entities/RaceRunEntity";
import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import FoodHistoryRepository from "@/repositories/FoodHistoryRepository";
import FoodRepository from "@/repositories/FoodRepository";
import ListRepository from "@/repositories/ListRepository";
import { AppDataSource } from "@/services/database/datasource";
import { randomUUID } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncOpInput } from "../helpers";
import runSync from "../services/runSync";

vi.hoisted(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

let user: UserEntity;
let list: ListEntity;
let milk: FoodEntity;
let eggs: FoodEntity;

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

const op = (type: string, payload: Record<string, unknown>, at = new Date().toISOString()): SyncOpInput => ({
  id: randomUUID(),
  type,
  at,
  payload,
});

const sync = (ops: SyncOpInput[], knownHash?: string, sentAt = new Date().toISOString()) =>
  runSync(user, { ops, sentAt, knownHash }) as Promise<any>;

const historiesOf = (food: FoodEntity) =>
  FoodHistoryRepository.find({ where: { food: { id: food.id } } });

const scoreOf = async (food: FoodEntity) =>
  (await FoodRepository.findOneByOrFail({ id: food.id })).inStockScore;

beforeEach(async () => {
  user = await createUser({
    username: "offline",
    email: "offline@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  list = await ListRepository.findOneByOrFail({ household: { id: user.household.id }, isMain: true });
  [milk, eggs] = (await FoodRepository.save(
    ["Milk", "Eggs"].map((name) => ({ name, inStockScore: 0.5, household: user.household, lists: [list] })),
  )) as [FoodEntity, FoodEntity];
});

describe("replaying operations", () => {
  it("applies a re-sent operation only once", async () => {
    const swipe = op("swipe", { foodId: milk.id, isInStock: false });

    await sync([swipe]);
    const again = await sync([swipe]);

    expect(again.acks).toEqual([{ id: swipe.id, status: "applied" }]);
    expect(await historiesOf(milk)).toHaveLength(1);
    expect(await ticketBalance(user.id)).toBe(10);
  });

  it("rejects a bad operation without blocking the ones behind it", async () => {
    const bad = op("swipe", { foodId: 999999, isInStock: false });
    const good = op("swipe", { foodId: milk.id, isInStock: false });

    const result = await sync([bad, good]);

    expect(result.acks).toEqual([
      { id: bad.id, status: "rejected" },
      { id: good.id, status: "applied" },
    ]);
    expect(result.retry).toBe(false);
  });

  it("rolls back everything a rejected operation started", async () => {
    const bad = op("food.remove", { listId: list.id, foodIds: [milk.id, -77] });

    await sync([bad]);

    const after = await ListRepository.findOneOrFail({ where: { id: list.id }, relations: { foods: true } });
    expect(after.foods.map((food) => food.id)).toContain(milk.id);
  });

  it("rejects an operation older than the limit", async () => {
    const old = op("swipe", { foodId: milk.id, isInStock: false }, minutesAgo(31 * 24 * 60));

    const result = await sync([old]);

    expect(result.acks[0]?.status).toBe("rejected");
    expect(await historiesOf(milk)).toHaveLength(0);
  });
});

describe("action times", () => {
  it("dates a swipe when it happened, not when it arrived", async () => {
    const at = minutesAgo(180);

    await sync([op("swipe", { foodId: milk.id, isInStock: false }, at)]);

    const [history] = await historiesOf(milk);
    expect(Math.abs(history!.createdAt!.getTime() - Date.parse(at))).toBeLessThan(1000);
  });

  it("corrects a phone clock that runs fast", async () => {
    const twoHoursFast = new Date(Date.now() + 2 * 3600000);
    const happened = new Date(twoHoursFast.getTime() - 3600000).toISOString();

    await sync(
      [op("swipe", { foodId: milk.id, isInStock: false }, happened)],
      undefined,
      twoHoursFast.toISOString(),
    );

    const [history] = await historiesOf(milk);
    expect(Math.abs(Date.now() - 3600000 - history!.createdAt!.getTime())).toBeLessThan(2000);
  });

  it("pays no speed bonus for slow swipes that sync together", async () => {
    await sync([
      op("swipe", { foodId: milk.id, isInStock: false }, minutesAgo(20)),
      op("swipe", { foodId: eggs.id, isInStock: false }, minutesAgo(10)),
    ]);

    expect(await ticketBalance(user.id)).toBe(20);
  });

  it("pays the speed bonus for fast swipes made offline", async () => {
    const first = Date.now() - 600000;

    await sync([
      op("swipe", { foodId: milk.id, isInStock: false }, new Date(first).toISOString()),
      op("swipe", { foodId: eggs.id, isInStock: false }, new Date(first + 500).toISOString()),
    ]);

    expect(await ticketBalance(user.id)).toBe(25);
  });

  it("pays nothing for a swipe too old to reward, but keeps the answer", async () => {
    await sync([op("swipe", { foodId: milk.id, isInStock: false }, minutesAgo(8 * 24 * 60))]);

    expect(await historiesOf(milk)).toHaveLength(1);
    expect(await ticketBalance(user.id)).toBe(0);
  });

  it("counts an offline round on the day it was played", async () => {
    const yesterday = new Date(Date.now() - 24 * 3600000).toISOString();

    await sync([op("swipe.complete", { tzOffset: 0 }, yesterday)]);

    const game = await getSwipeGame(user.household.id, 0);
    expect(game.playedToday).toBe(false);
    expect(game.level).toBe(2);
  });

  it("counts a household's round once when two phones finish the same day", async () => {
    await sync([op("swipe.complete", { tzOffset: 0 })]);
    await sync([op("swipe.complete", { tzOffset: 0 })]);

    expect((await getSwipeGame(user.household.id, 0)).level).toBe(1);
  });
});

describe("buying and late swipes", () => {
  const startAndBuy = async (at: string, food = milk) => {
    await sync([
      op("shop.start", { tempId: -1, foodIds: [] }, at),
      op("shop.buy", { shopListId: -1, foodId: food.id }, at),
    ]);
  };

  it("ignores a swipe made before the food was bought", async () => {
    await startAndBuy(minutesAgo(10));

    await sync([op("swipe", { foodId: milk.id, isInStock: false }, minutesAgo(60))]);

    expect(await historiesOf(milk)).toHaveLength(0);
    expect(await scoreOf(milk)).toBe(1);
  });

  it("keeps a swipe made after the purchase when the purchase syncs late", async () => {
    await sync([op("swipe", { foodId: milk.id, isInStock: false }, minutesAgo(5))]);

    await startAndBuy(minutesAgo(60));

    expect(await historiesOf(milk)).toHaveLength(1);
    expect(await scoreOf(milk)).toBe(0);
  });

  it("never moves the purchase date backwards", async () => {
    await startAndBuy(minutesAgo(5));
    const recent = await FoodRepository.findOneByOrFail({ id: milk.id });

    await startAndBuy(minutesAgo(60));

    const after = await FoodRepository.findOneByOrFail({ id: milk.id });
    expect(after.lastBoughtAt).toEqual(recent.lastBoughtAt);
  });

  it("combines purchases from two offline runs into the open list", async () => {
    const first = await sync([
      op("shop.start", { tempId: -1, foodIds: [] }),
      op("shop.buy", { shopListId: -1, foodId: milk.id }),
    ]);
    const second = await sync([
      op("shop.start", { tempId: -9, foodIds: [] }),
      op("shop.buy", { shopListId: -9, foodId: eggs.id }),
    ]);

    expect(second.ids["-9"]).toBe(first.ids["-1"]);
    const shopList = await findShopList({ id: first.ids["-1"]! });
    expect((shopList!.boughtFoods as FoodEntity[]).map((food) => food.id).sort()).toEqual(
      [milk.id, eggs.id].sort(),
    );
    expect(shopList!.endedAt).toBeTruthy();
  });

  it("still starts a run when the server no longer thinks anything is needed", async () => {
    await FoodRepository.update({ household: { id: user.household.id } }, { inStockScore: 1 });

    const result = await sync([
      op("shop.start", { tempId: -1, foodIds: [milk.id] }),
      op("shop.buy", { shopListId: -1, foodId: milk.id }),
    ]);

    expect(result.acks.map((ack: { status: string }) => ack.status)).toEqual(["applied", "applied"]);
  });
});

describe("foods created offline", () => {
  it("maps a temporary id and accepts operations that use it", async () => {
    const create = op("food.create", { tempId: -5, name: "Oat milk", listId: list.id });
    const swipe = op("swipe", { foodId: -5, isInStock: false });

    const result = await sync([create, swipe]);

    expect(result.ids["-5"]).toBeGreaterThan(0);
    expect(result.acks.map((ack: { status: string }) => ack.status)).toEqual(["applied", "applied"]);
    const again = await sync([create, swipe]);
    expect(again.ids["-5"]).toBe(result.ids["-5"]);
    expect(await FoodRepository.countBy({ name: "Oat milk" })).toBe(1);
  });

  it("keeps the scanned product on a new food and on an existing one", async () => {
    const product = { barcode: "3017620422003", quantity: "750 g", icon: "pasta" };
    await sync([op("food.create", { tempId: -6, name: "Spread", listId: list.id, product })]);
    await sync([op("food.create", { tempId: -7, name: "spread", listId: list.id, product: { barcode: "8076800195057", icon: "rice" } })]);

    const food = await FoodRepository.findOneByOrFail({ name: "Spread" });
    expect(food).toMatchObject({ barcodes: ["3017620422003", "8076800195057"], quantity: "750 g", icon: "pasta" });
  });

  it("merges a food two housemates added under the same name", async () => {
    const result = await sync([op("food.create", { tempId: -5, name: " MILK ", listId: list.id })]);

    expect(result.ids["-5"]).toBe(milk.id);
    expect(await FoodRepository.countBy({ household: { id: user.household.id } })).toBe(2);
  });

  it("rejects an operation on a food whose creation was rejected", async () => {
    const result = await sync([op("swipe", { foodId: -5, isInStock: false })]);

    expect(result.acks[0]?.status).toBe("rejected");
  });
});

describe("editing foods", () => {
  it("keeps the latest edit when an older one syncs after it", async () => {
    await sync([op("food.edit", { foodId: milk.id, name: "New name" }, minutesAgo(1))]);
    await sync([op("food.edit", { foodId: milk.id, name: "Old name" }, minutesAgo(60))]);

    expect((await FoodRepository.findOneByOrFail({ id: milk.id })).name).toBe("New name");
  });
});

describe("offline races", () => {
  it("records answers on a race that still exists", async () => {
    const race = await getOrCreateRace(user.household.id, "2026-01-01");

    await sync([op("race.answer", { raceId: race!.id, foodId: milk.id, answer: "out", ms: 900 })]);

    const run = await AppDataSource.manager.findOneByOrFail(RaceRunEntity, { race: { id: race!.id } });
    expect(run.answers).toEqual([{ foodId: milk.id, answer: "out", ms: 900 }]);
  });

  const ghost = (food: FoodEntity, deck: FoodEntity[], day = "2026-01-02") =>
    op("race.answer", {
      raceId: -1,
      day,
      foodIds: deck.map((entry) => entry.id),
      foodId: food.id,
      answer: "out",
      ms: 900,
    });

  it("turns an offline deck into the day's real race, and finishes the run", async () => {
    await sync([ghost(milk, [milk, eggs]), ghost(eggs, [milk, eggs])]);

    const race = await AppDataSource.manager.findOneByOrFail(RaceEntity, { day: "2026-01-02" });
    expect(race.foodIds.sort()).toEqual([milk.id, eggs.id].sort());
    const run = await AppDataSource.manager.findOneByOrFail(RaceRunEntity, { race: { id: race.id } });
    expect(run.totalMs).toBe(1800);
    expect(run.finishedAt).toBeTruthy();
    expect(await ticketBalance(user.id)).toBe(25);
  });

  it("keeps offline answers as swipes when a housemate's race has other foods", async () => {
    const tea = await FoodRepository.save({
      name: "Tea",
      inStockScore: 0.5,
      household: user.household,
      lists: [list],
    });
    await AppDataSource.manager.save(RaceEntity, {
      household: { id: user.household.id },
      day: "2026-01-02",
      foodIds: [tea.id],
    });

    const result = await sync([ghost(milk, [milk, eggs])]);

    expect(result.acks[0].status).toBe("applied");
    expect(await AppDataSource.manager.count(RaceRunEntity)).toBe(0);
    expect(await historiesOf(milk)).toHaveLength(1);
    expect(await ticketBalance(user.id)).toBe(10);
  });

  it("joins a housemate's race when the foods match", async () => {
    const race = await AppDataSource.manager.save(RaceEntity, {
      household: { id: user.household.id },
      day: "2026-01-02",
      foodIds: [milk.id, eggs.id],
    });

    await sync([ghost(milk, [milk, eggs])]);

    const run = await AppDataSource.manager.findOneByOrFail(RaceRunEntity, { race: { id: race.id } });
    expect(run.answers).toHaveLength(1);
  });

  it("ignores a forged deck from another household", async () => {
    const stranger = await createUser({
      username: "stranger",
      email: "stranger@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });
    const theirs = await FoodRepository.save({ name: "Theirs", household: stranger.household });

    await sync([
      op("race.answer", {
        raceId: -1,
        day: "2026-01-03",
        foodIds: [theirs.id, milk.id],
        foodId: milk.id,
        answer: "out",
        ms: 900,
      }),
    ]);

    const race = await AppDataSource.manager.findOneByOrFail(RaceEntity, { day: "2026-01-03" });
    expect(race.foodIds).toEqual([milk.id]);
  });

  it("still keeps the swipe when an old client sends no deck", async () => {
    await sync([op("race.answer", { raceId: -1, foodId: milk.id, answer: "out", ms: 900 })]);

    expect(await AppDataSource.manager.count(RaceRunEntity)).toBe(0);
    expect(await historiesOf(milk)).toHaveLength(1);
  });
});

describe("pulling the household", () => {
  it("returns the snapshot only when it changed", async () => {
    const first = await sync([]);
    const unchanged = await sync([], first.hash);
    const changed = await sync([op("swipe", { foodId: milk.id, isInStock: false })], first.hash);

    expect(first.snapshot?.foods.map((food: FoodEntity) => food.name)).toEqual(["Milk", "Eggs"]);
    expect(unchanged).not.toHaveProperty("snapshot");
    expect(changed.snapshot?.foods[0]?.histories).toHaveLength(1);
  });

  it("includes a housemate's changes made outside of sync", async () => {
    const first = await sync([]);
    await AppDataSource.manager.save(FoodHistoryEntity, { food: { id: milk.id }, isInStock: false });

    expect((await sync([], first.hash)).snapshot).toBeDefined();
  });

  it("aggregates learned store order per food pair", async () => {
    await sync([
      op("shop.start", { tempId: -1, foodIds: [] }),
      op("shop.buy", { shopListId: -1, foodId: milk.id }),
      op("shop.buy", { shopListId: -1, foodId: eggs.id }),
    ]);

    const { snapshot } = await sync([]);

    expect(snapshot?.frequencies).toEqual([{ foodId: milk.id, nextFoodId: eggs.id, count: 1 }]);
  });

  it("never exposes another household's foods", async () => {
    const stranger = await createUser({
      username: "stranger",
      email: "stranger@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });

    const result = (await runSync(stranger, {
      ops: [op("swipe", { foodId: milk.id, isInStock: false })],
      sentAt: new Date().toISOString(),
    })) as any;

    expect(result.acks[0]?.status).toBe("rejected");
    expect(result.snapshot?.foods).toEqual([]);
  });
});

describe("refresh tokens on a bad connection", () => {
  const issue = async () => {
    const token = deliverJwtToken(
      { id: user.id, email: `${"long-address".repeat(10)}@example.com`, username: user.username },
      "15d",
      process.env.JWT_REFRESH_SECRET,
    );
    await createRefreshToken(token, user.id);
    return token;
  };

  it("accepts the old token again when the replacement never arrived", async () => {
    const lost = await issue();
    await rotateRefreshToken(lost, "token-replaced");

    await expect(checkRefreshToken(lost)).resolves.toBeDefined();
    const retried = await rotateRefreshToken(lost, "token-replaced");
    await expect(checkRefreshToken(retried.newRefreshToken)).resolves.toBeDefined();
  });

  it("rejects the old token once its replacement has been used", async () => {
    const old = await issue();
    const next = await rotateRefreshToken(old, "token-replaced");
    await rotateRefreshToken(next.newRefreshToken, "token-replaced");

    await expect(checkRefreshToken(old)).rejects.toMatchObject({ status: 401 });
  });

  it("rejects every token after a logout", async () => {
    const old = await issue();
    await rotateRefreshToken(old, "token-replaced");
    await revokeAllRefreshTokenByUserId(user.id, "user-logout");

    await expect(checkRefreshToken(old)).rejects.toMatchObject({ status: 401 });
  });

  it("answers 401 for a garbage token", async () => {
    await expect(checkRefreshToken("garbage")).rejects.toMatchObject({ status: 401 });
  });
});

describe("inventory without maintenance", () => {
  it("adds a food as needed without paying tickets", async () => {
    const result = await sync([op("food.create", { tempId: -5, name: "Oat milk", listId: list.id, needed: true })]);

    const created = await FoodRepository.findOneByOrFail({ id: result.ids["-5"] });
    expect(created.inStockScore).toBe(0);
    expect(await ticketBalance(user.id)).toBe(0);
  });

  it("marks an existing food as needed when it is added again", async () => {
    await FoodRepository.update(milk.id, { inStockScore: 1 });

    const result = await sync([op("food.create", { tempId: -6, name: "milk", listId: list.id, needed: true })]);

    expect(result.ids["-6"]).toBe(milk.id);
    expect(await scoreOf(milk)).toBe(0);
  });

  it("removes a discarded shop so it is never counted", async () => {
    const start = op("shop.start", { tempId: -7, foodIds: [milk.id, eggs.id] }, minutesAgo(3));
    const buy = op("shop.buy", { shopListId: -7, foodId: milk.id }, minutesAgo(2));
    const cancel = op("shop.cancel", { shopListId: -7, discard: true }, minutesAgo(1));

    const result = await sync([start, buy, cancel]);

    expect(await findShopList({ id: result.ids["-7"] })).toBeNull();
    expect(result.snapshot.dashboard.shopLists.total).toBe(0);
    expect(await scoreOf(milk)).toBe(1);
  });

  it("stores the household's eater profiles, ignoring unknown ones", async () => {
    const result = await sync([op("household.profiles", { profiles: ["meat", "cat", "nonsense", "meat"] })]);

    expect(result.snapshot.household.eaterProfiles).toEqual(["meat", "cat"]);
  });

  it("counts each time a suggestion is declined", async () => {
    await sync([op("suggestion.decline", { name: " Oat Milk " }, minutesAgo(5))]);
    const result = await sync([op("suggestion.decline", { name: "oat milk" }, minutesAgo(1))]);

    expect(result.snapshot.household.declinedSuggestions["oat milk"].count).toBe(2);
  });
});

describe("join codes", () => {
  it("hides the join code until the email is confirmed", async () => {
    const before = await sync([]);
    await AppDataSource.manager.update(UserEntity, user.id, { emailConfirmedAt: new Date() });
    user = await AppDataSource.manager.findOneOrFail(UserEntity, { where: { id: user.id }, relations: ["household"] });
    const after = await sync([]);

    expect(before.snapshot.household.joinCode).toBe("");
    expect(before.snapshot.user.household.joinCode).toBe("");
    expect(after.snapshot.household.joinCode).toBe(user.household.joinCode);
  });
});
