import createUser from "@/api/users/services/createUser";
import FoodEntity from "@/entities/FoodEntity";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import UserEntity from "@/entities/UserEntity";
import FoodRepository from "@/repositories/FoodRepository";
import TicketEntryRepository from "@/repositories/TicketEntryRepository";
import { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import editFoods from "@/api/foods/controllers/editFoods";
import awardSwipe from "../services/awardSwipe";
import prizeCounter from "../services/prizeCounter";
import redeemPrize from "../services/redeemPrize";
import skinAccess from "../services/skinAccess";
import ticketBalance from "../services/ticketBalance";

let user: UserEntity;
let foods: FoodEntity[];

const grant = (amount: number) =>
  TicketEntryRepository.save({
    user,
    amount,
    reason: TicketReason.SWIPE,
  } as TicketEntryEntity);

beforeEach(async () => {
  user = await createUser({
    username: "gamer",
    email: "gamer@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
  foods = await FoodRepository.save(
    Array.from({ length: 12 }, (_, i) =>
      FoodRepository.create({
        name: `Food ${i}`,
        inStockScore: 0.2,
        household: user.household,
      }),
    ),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("tickets", () => {
  it("pays 10 tickets for a swipe", async () => {
    const result = await awardSwipe(user.id, foods[0]!.id);

    expect(result).toEqual({ earned: 10, bonus: 0, balance: 10 });
  });

  it("adds a speed bonus when swipes come quickly", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-10T10:00:00Z"));
    await awardSwipe(user.id, foods[0]!.id);
    vi.setSystemTime(new Date("2026-03-10T10:00:01Z"));
    const second = await awardSwipe(user.id, foods[1]!.id);

    expect(second).toEqual({ earned: 15, bonus: 5, balance: 25 });
  });

  it("gives no speed bonus after a slow swipe", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-10T10:00:00Z"));
    await awardSwipe(user.id, foods[0]!.id);
    vi.setSystemTime(new Date("2026-03-10T10:00:05Z"));

    expect((await awardSwipe(user.id, foods[1]!.id)).bonus).toBe(0);
  });

  it("pays each food only once a day", async () => {
    await awardSwipe(user.id, foods[0]!.id);
    const again = await awardSwipe(user.id, foods[0]!.id);

    expect(again.earned).toBe(0);
    expect(again.balance).toBe(10);
  });

  it("stops paying after 10 swipes in a day", async () => {
    for (const food of foods.slice(0, 10)) {
      await awardSwipe(user.id, food.id);
    }
    const eleventh = await awardSwipe(user.id, foods[10]!.id);

    expect(eleventh.earned).toBe(0);
  });

  it("pays a food again once 24 hours have passed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-10T10:00:00Z"));
    await awardSwipe(user.id, foods[0]!.id);
    vi.setSystemTime(new Date("2026-03-11T10:00:01Z"));

    expect((await awardSwipe(user.id, foods[0]!.id)).earned).toBe(10);
  });

  it("can't be paid twice by parallel requests", async () => {
    const results = await Promise.all(
      Array.from({ length: 4 }, () => awardSwipe(user.id, foods[0]!.id)),
    );

    expect(results.filter((result) => result.earned > 0)).toHaveLength(1);
    expect(await ticketBalance(user.id)).toBe(10);
  });

  it("caps paid swipes even when they arrive in parallel", async () => {
    await Promise.all(foods.map((food) => awardSwipe(user.id, food.id)));

    expect(
      await TicketEntryRepository.count({
        where: { user: { id: user.id }, reason: TicketReason.SWIPE },
      }),
    ).toBe(10);
  });

  it("pays tickets through the swipe endpoint", async () => {
    let body: any;
    const res = {
      status: () => res,
      json: (value: unknown) => {
        body = value;
        return res;
      },
    } as unknown as Response;

    await editFoods(
      {
        user,
        params: { id: String(foods[0]!.id) },
        body: { foodId: foods[0]!.id, isInStock: false, tzOffset: 0 },
      } as unknown as Request,
      res,
    );

    expect(body).toEqual({ earned: 10, bonus: 0, balance: 10 });
  });

  it("only writes history for the food it checked", async () => {
    const stranger = await createUser({
      username: "stranger",
      email: "stranger@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });
    const [theirFood] = await FoodRepository.save([
      FoodRepository.create({
        name: "Theirs",
        inStockScore: 0.2,
        household: stranger.household,
      }),
    ]);
    const res = {
      status: () => res,
      json: () => res,
    } as unknown as Response;

    await editFoods(
      {
        user,
        params: { id: String(foods[0]!.id) },
        body: { foodId: theirFood!.id, isInStock: false },
      } as unknown as Request,
      res,
    );

    const reloaded = await FoodRepository.findOne({
      where: { id: theirFood!.id },
      relations: { foodHistories: true },
    });
    expect(reloaded?.foodHistories ?? []).toHaveLength(0);
  });
});

describe("prizes", () => {
  it("lets admins wear every skin without owning it", async () => {
    const counter = await prizeCounter(user.id, undefined, true);
    const roast = counter.prizes.find((prize) => prize.skin === "roast");

    expect(roast?.owned).toBe(false);
    expect(roast?.wearable).toBe(true);
    expect((await prizeCounter(user.id)).prizes.find((prize) => prize.skin === "roast")?.wearable).toBe(false);
  });

  it("lists the catalog with the balance", async () => {
    await grant(120);
    const counter = await prizeCounter(user.id);

    expect(counter.balance).toBe(120);
    expect(counter.prizes.find((prize) => prize.skin === "arcade")?.owned).toBe(
      true,
    );
    expect(counter.prizes.find((prize) => prize.skin === "roast")?.owned).toBe(
      false,
    );
  });

  it("redeems a prize and spends the tickets", async () => {
    await grant(1100);
    const counter = await redeemPrize(user.id, "skin:roast");

    expect(counter.balance).toBe(100);
    expect(counter.prizes.find((prize) => prize.skin === "roast")?.owned).toBe(
      true,
    );
  });

  it("refuses a prize you can't afford", async () => {
    await grant(999);

    await expect(redeemPrize(user.id, "skin:roast")).rejects.toMatchObject({
      status: 402,
    });
    expect(await ticketBalance(user.id)).toBe(999);
  });

  it("lets only one of two parallel redeems through", async () => {
    await grant(1100);
    const results = await Promise.allSettled([
      redeemPrize(user.id, "skin:roast"),
      redeemPrize(user.id, "skin:roast"),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await ticketBalance(user.id)).toBe(100);
  });

  it("refuses a prize you already own", async () => {
    await grant(1200);
    await redeemPrize(user.id, "skin:roast");

    await expect(redeemPrize(user.id, "skin:roast")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("refuses an unknown prize", async () => {
    await expect(redeemPrize(user.id, "skin:nope")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("tells known skins from unknown ones", async () => {
    expect(await skinAccess(user.id, "arcade")).toBe("allowed");
    expect(await skinAccess(user.id, "nope")).toBe("unknown");
  });
});
