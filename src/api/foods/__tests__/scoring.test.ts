import { RULES } from "@/api/catalog/rules";
import { describe, expect, it } from "vitest";
import { waitDaysFor } from "../helpers";
import { cleanFrequencyDays, cycleOf, explainScore, scoreFood, type ScoreAnswer } from "../scoring";

const DAY_MS = 24 * 3600000;
const NOW = Date.parse("2026-06-01T12:00:00Z");
const ago = (days: number) => new Date(NOW - days * DAY_MS);
const answer = (isInStock: boolean, daysAgo: number): ScoreAnswer => ({ isInStock, at: ago(daysAgo) });
const boughtEvery = (days: number, times: number) =>
  Array.from({ length: times }, (_, index) => ago((times - index) * days).toISOString());

describe("scoreFood", () => {
  it("is full without any answer", () => {
    expect(scoreFood({}, [])).toBe(1);
  });

  it("averages answers given at the same time", () => {
    expect(scoreFood({}, [answer(true, 0), answer(false, 0)])).toBe(0.5);
  });

  it("does not let a long in-stock past bury a fresh run of outs", () => {
    const past = Array.from({ length: 60 }, (_, index) => answer(true, 3 + index * 7));
    const outs = [answer(false, 2), answer(false, 1), answer(false, 0)];

    expect(scoreFood({}, [...past, ...outs])).toBeLessThan(RULES.shop.buyBelow);
  });

  it("keeps a single stray answer from flipping a steady food to empty", () => {
    const steady = Array.from({ length: 5 }, (_, index) => answer(true, 1 + index));

    expect(scoreFood({}, [...steady, answer(false, 0)])).toBeGreaterThan(RULES.shop.buyBelow);
  });

  it("forgets old answers faster for a food bought every week than every month", () => {
    const answers = [answer(true, 6), answer(true, 4), answer(false, 0)];

    expect(scoreFood({ frequencyDays: 7 }, answers)).toBeLessThan(scoreFood({ frequencyDays: 30 }, answers));
  });
});

describe("cycleOf", () => {
  it("falls back to the default cycle when nothing is known", () => {
    expect(cycleOf({})).toMatchObject({ days: RULES.score.defaultCycleDays, known: false });
  });

  it("leans on a declared frequency", () => {
    const cycle = cycleOf({ frequencyDays: 7 });

    expect(cycle).toMatchObject({ days: 7, known: true });
  });

  it("trusts the purchase rhythm more as purchases pile up", () => {
    const few = cycleOf({ frequencyDays: 7, boughtDates: boughtEvery(20, 3) });
    const many = cycleOf({ frequencyDays: 7, boughtDates: boughtEvery(20, 8) });

    expect(many.days).toBeGreaterThan(few.days);
    expect(many.days).toBeLessThan(20);
  });

  it("stretches the cycle for a big pack", () => {
    expect(cycleOf({ quantity: "2 kg" }).days).toBeGreaterThan(cycleOf({ quantity: "250 g" }).days);
  });
});

describe("waitDaysFor", () => {
  it("asks again sooner for a food declared weekly", () => {
    expect(waitDaysFor({ frequencyDays: 7 })).toBeLessThan(waitDaysFor({}));
  });

  it("keeps the stale delay when the cycle is only a guess", () => {
    expect(waitDaysFor({})).toBe(RULES.swipe.staleDays);
    expect(waitDaysFor({ quantity: "2 kg" })).toBe(RULES.swipe.bigPackStaleDays);
  });
});

describe("cleanFrequencyDays", () => {
  it("accepts whole days in range and null to clear", () => {
    expect(cleanFrequencyDays(7)).toBe(7);
    expect(cleanFrequencyDays(null)).toBeNull();
  });

  it("ignores anything else", () => {
    expect(cleanFrequencyDays(0)).toBeUndefined();
    expect(cleanFrequencyDays(1000)).toBeUndefined();
    expect(cleanFrequencyDays(2.5)).toBeUndefined();
    expect(cleanFrequencyDays("7")).toBeUndefined();
    expect(cleanFrequencyDays(undefined)).toBeUndefined();
  });
});

describe("explainScore", () => {
  it("lists every source that shaped the cycle", () => {
    const explained = explainScore({ frequencyDays: 7, quantity: "2 kg" }, [answer(true, 0)]);

    expect(explained.estimates.map((estimate) => estimate.source)).toEqual(["declared"]);
    expect(explainScore({ quantity: "2 kg" }, []).estimates.map((estimate) => estimate.source)).toEqual([
      "pack",
      "fallback",
    ]);
    expect(explained.score).toBe(1);
  });
});
