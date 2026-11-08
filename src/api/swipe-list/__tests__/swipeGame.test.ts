import createUser from "@/api/users/services/createUser";
import SwipeListEntity, { SwipeListStatus } from "@/entities/SwipeListEntity";
import UserEntity from "@/entities/UserEntity";
import SwipeListRepository from "@/repositories/SwipeListRepository";
import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import completeSwipeList from "../controllers/completeSwipeList";
import readSwipeGame from "../controllers/readSwipeGame";
import { parseTzOffset } from "@/helpers/localDay";
import getSwipeGame from "../services/getSwipeGame";

const DAY = 24 * 3600000;
let user: UserEntity;

const saveSession = (endedAt: Date, status = SwipeListStatus.COMPLETED) =>
  SwipeListRepository.save({
    status,
    endedAt,
    household: user.household,
  } as SwipeListEntity);

const respond = () => {
  const out: { status?: number; body?: any } = {};
  const res = {
    status: (code: number) => {
      out.status = code;
      return res;
    },
    json: (body: unknown) => {
      out.body = body;
      return res;
    },
  } as unknown as Response;
  return { out, res };
};

beforeEach(async () => {
  user = await createUser({
    username: "player",
    email: "player@example.com",
    password: "Str0ng!Passw0rd",
    householdChoice: "create",
  });
});

describe("swipe game", () => {
  it("starts a new household at level 1", async () => {
    expect(await getSwipeGame(user.household.id, 0)).toEqual({
      level: 1,
      playedToday: false,
    });
  });

  it("levels up once per played day, not per session", async () => {
    await saveSession(new Date(Date.now() - 3 * DAY));
    await saveSession(new Date(Date.now() - 3 * DAY));
    await saveSession(new Date(Date.now() - DAY));

    expect(await getSwipeGame(user.household.id, 0)).toEqual({
      level: 3,
      playedToday: false,
    });
  });

  it("ignores sessions that were never completed", async () => {
    await saveSession(new Date(Date.now() - DAY), SwipeListStatus.STARTED);

    expect((await getSwipeGame(user.household.id, 0)).level).toBe(1);
  });

  it("keeps the level of the day once played", async () => {
    await saveSession(new Date(Date.now() - DAY));
    await saveSession(new Date());

    expect(await getSwipeGame(user.household.id, 0)).toEqual({
      level: 2,
      playedToday: true,
    });
  });

  it("uses the player's local day", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-03-10T23:30:00Z"));
      await saveSession(new Date("2026-03-10T22:30:00Z"));

      expect((await getSwipeGame(user.household.id, 0)).playedToday).toBe(true);

      vi.setSystemTime(new Date("2026-03-11T00:30:00Z"));
      expect((await getSwipeGame(user.household.id, 0)).playedToday).toBe(
        false,
      );
      expect((await getSwipeGame(user.household.id, 60)).playedToday).toBe(
        true,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not share progress between households", async () => {
    const other = await createUser({
      username: "other",
      email: "other@example.com",
      password: "Str0ng!Passw0rd",
      householdChoice: "create",
    });
    await saveSession(new Date());

    expect((await getSwipeGame(other.household.id, 0)).playedToday).toBe(false);
  });

  it("records one session per day however often it completes", async () => {
    const first = respond();
    await completeSwipeList(
      { user, body: { tzOffset: 0 } } as unknown as Request,
      first.res,
    );
    const second = respond();
    await completeSwipeList(
      { user, body: { tzOffset: 0 } } as unknown as Request,
      second.res,
    );

    expect(first.out).toEqual({
      status: 201,
      body: { level: 1, playedToday: true },
    });
    expect(second.out.body).toEqual({ level: 1, playedToday: true });
    expect(
      await SwipeListRepository.count({
        where: { household: { id: user.household.id } },
      }),
    ).toBe(1);
  });

  it("reads the game for the authenticated household", async () => {
    await saveSession(new Date());
    const { out, res } = respond();

    await readSwipeGame(
      { user, query: { tzOffset: "0" } } as unknown as Request,
      res,
    );

    expect(out).toEqual({
      status: 200,
      body: { level: 1, playedToday: true },
    });
  });

  it("falls back to UTC on an invalid offset", () => {
    expect(parseTzOffset("-120")).toBe(-120);
    expect(parseTzOffset("nope")).toBe(0);
    expect(parseTzOffset(99999)).toBe(0);
    expect(parseTzOffset(undefined)).toBe(0);
  });
});
