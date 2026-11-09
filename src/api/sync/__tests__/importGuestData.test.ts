import getMostLikelyNextFoods from "@/api/frequencies/services/getMostLikelyNextFood";
import ticketBalance from "@/api/prizes/services/ticketBalance";
import createUser from "@/api/users/services/createUser";
import findUser from "@/api/users/services/findUser";
import getSwipeGame from "@/api/swipe-list/services/getSwipeGame";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import ListEntity from "@/entities/ListEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import ListRepository from "@/repositories/ListRepository";
import { AppDataSource } from "@/services/database/datasource";
import doTransaction from "@/utils/doTransaction";
import { beforeEach, describe, expect, it } from "vitest";
import importGuestData, { GuestData } from "../services/importGuestData";

let user: UserEntity;
let list: ListEntity;

const ago = (days: number) => new Date(Date.now() - days * 24 * 3600000).toISOString();

const guestData = (overrides: Partial<GuestData> = {}): GuestData => ({
  importId: "guest-1",
  sentAt: new Date().toISOString(),
  tzOffset: 0,
  foods: [
    {
      id: -2,
      name: "Butter",
      icon: "cheese",
      inStockScore: 0.5,
      onList: true,
      histories: [
        { isInStock: true, at: ago(100) },
        { isInStock: false, at: ago(50) },
      ],
    },
    { id: -3, name: "Cheese", inStockScore: 0.5, onList: true, lastBoughtAt: ago(10) },
    { id: -4, name: "Jam", inStockScore: 0.5, onList: true },
    { id: -5, name: "Removed", inStockScore: 1, onList: false },
  ],
  frequencies: [
    { foodId: -2, nextFoodId: -3, count: 40 },
    { foodId: -2, nextFoodId: -4, count: 3 },
  ],
  playedAt: [ago(300), ago(200), ago(1)],
  runs: [
    {
      startFoodIds: [-2, -3],
      boughtFoodIds: [-3],
      buyLog: [{ foodId: -3, at: ago(10) }],
      startedAt: ago(10),
      createdAt: ago(10),
      endedAt: ago(10),
    },
  ],
  balance: 12345,
  ownedPrizes: ["skin:roast", "skin:unknown"],
  recentSwipes: [{ foodId: -2, at: ago(0.5) }],
  skin: "roast",
  language: "fr",
  ...overrides,
});

const run = (data: GuestData, options?: { withPreferences?: boolean }, target = user) =>
  doTransaction((m) => importGuestData(target, data, m, options));

const foodNamed = (name: string) =>
  FoodRepository.findOneOrFail({ where: { name, household: { id: user.household.id } } });

beforeEach(async () => {
  user = await createUser({
    username: "guesty",
    email: "guesty@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  list = await ListRepository.findOneByOrFail({ household: { id: user.household.id }, isMain: true });
});

describe("importing a guest's phone", () => {
  it("keeps foods, scores, icons and original dates", async () => {
    await run(guestData());

    const butter = await foodNamed("Butter");
    expect(butter.inStockScore).toBe(0.5);
    expect(butter.icon).toBe("cheese");
    const histories = await AppDataSource.manager.find(FoodHistoryEntity, {
      where: { food: { id: butter.id } },
      order: { createdAt: "ASC" },
    });
    expect(histories.map((entry) => entry.isInStock)).toEqual([true, false]);
    expect(Math.abs(histories[0]!.createdAt!.getTime() - Date.parse(ago(100)))).toBeLessThan(5000);
  });

  it("keeps a removed food off the list", async () => {
    await run(guestData());

    const after = await ListRepository.findOneOrFail({ where: { id: list.id }, relations: { foods: true } });
    expect(after.foods.map((food) => food.name).sort()).toEqual(["Butter", "Cheese", "Jam"]);
    expect(await foodNamed("Removed")).toBeTruthy();
  });

  it("keeps the learned store order", async () => {
    await run(guestData({ runs: [] }));

    const [butter, cheese] = await Promise.all([foodNamed("Butter"), foodNamed("Cheese")]);
    await FoodRepository.update(cheese.id, { inStockScore: 0.2 });
    expect(await getMostLikelyNextFoods(butter.id, 1)).toEqual([cheese.id]);
  });

  it("scales very long store-order history without changing the favourite", async () => {
    await run(
      guestData({
        runs: [],
        frequencies: [
          { foodId: -2, nextFoodId: -3, count: 900 },
          { foodId: -2, nextFoodId: -4, count: 100 },
        ],
      }),
    );

    const [butter, cheese] = await Promise.all([foodNamed("Butter"), foodNamed("Cheese")]);
    await FoodRepository.update(cheese.id, { inStockScore: 0.2 });
    expect(await getMostLikelyNextFoods(butter.id, 1)).toEqual([cheese.id]);
    const rows = await AppDataSource.manager.query(
      "SELECT COUNT(*) AS n FROM frequencies WHERE foodId = ?",
      [butter.id],
    );
    expect(Number(rows[0].n)).toBeLessThanOrEqual(101);
  });

  it("keeps days played and the level", async () => {
    await run(guestData());

    const game = await getSwipeGame(user.household.id, 0);
    expect(game.level).toBe(4);
    expect(game.playedToday).toBe(false);
  });

  it("keeps finished shop runs and their purchase dates", async () => {
    await run(guestData());

    const runs = await AppDataSource.manager.find(ShopListEntity, {
      where: { household: { id: user.household.id } },
      relations: { boughtFoods: true, startFoods: true, user: true },
    });
    expect(runs).toHaveLength(1);
    expect((runs[0]!.boughtFoods as FoodEntity[]).map((food) => food.name)).toEqual(["Cheese"]);
    expect(runs[0]!.user?.id).toBe(user.id);
    const cheese = await foodNamed("Cheese");
    expect(runs[0]!.buyLog?.[0]?.foodId).toBe(cheese.id);
  });

  it("imports the full ticket balance with no cap, and valid unlocks", async () => {
    await run(guestData());

    expect(await ticketBalance(user.id)).toBe(12345);
    const unlocks = await AppDataSource.manager.find(UnlockEntity, { where: { user: { id: user.id } } });
    expect(unlocks.map((unlock) => unlock.prizeId)).toEqual(["skin:roast"]);
  });

  it("only applies preferences at signup", async () => {
    await run(guestData());
    expect((await findUser({ id: user.id })).language).toBeNull();

    await run(guestData({ importId: "guest-2", foods: [], balance: 0 }), { withPreferences: true });
    const after = await findUser({ id: user.id });
    expect(after.language).toBe("fr");
    expect(after.skin).toBe("roast");
  });

  it("can be retried safely after a lost response", async () => {
    expect(await run(guestData())).toBe(true);
    expect(await run(guestData())).toBe(false);

    expect(await ticketBalance(user.id)).toBe(12345);
    expect(await FoodRepository.countBy({ household: { id: user.household.id } })).toBe(4);
  });

  it("rolls everything back when any part fails", async () => {
    await expect(
      run(guestData({ runs: "broken" as unknown as GuestData["runs"] })),
    ).rejects.toMatchObject({ status: 400 });

    expect(await FoodRepository.countBy({ household: { id: user.household.id } })).toBe(0);
    expect(await ticketBalance(user.id)).toBe(0);
  });
});

describe("merging into an existing household", () => {
  beforeEach(async () => {
    await FoodRepository.save({
      name: "butter",
      inStockScore: 0.75,
      household: user.household,
      lists: [list],
      lastBoughtAt: new Date(Date.parse(ago(60))),
    });
  });

  it("merges same-name foods instead of duplicating them", async () => {
    await run(guestData());

    expect(await FoodRepository.countBy({ household: { id: user.household.id } })).toBe(4);
  });

  it("ignores guest answers older than the household's last purchase", async () => {
    await run(guestData());

    const butter = await FoodRepository.findOneOrFail({
      where: { name: "butter", household: { id: user.household.id } },
    });
    const histories = await AppDataSource.manager.find(FoodHistoryEntity, {
      where: { food: { id: butter.id } },
    });
    expect(histories.map((entry) => entry.isInStock)).toEqual([false]);
    expect(butter.inStockScore).toBe(0);
  });

  it("counts one round per day across the household", async () => {
    await run(guestData({ playedAt: [ago(1), ago(1)] }));

    expect((await getSwipeGame(user.household.id, 0)).level).toBe(2);
  });

  it("never touches another household", async () => {
    const stranger = await createUser({
      username: "stranger",
      email: "stranger@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });

    await run(guestData(), undefined, stranger);

    expect(await FoodRepository.countBy({ household: { id: user.household.id } })).toBe(1);
    expect(await FoodRepository.countBy({ household: { id: stranger.household.id } })).toBe(4);
  });
});
