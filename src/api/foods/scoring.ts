import { RULES } from "@/api/catalog/rules";
import { buyGapDays, packSize } from "./helpers";

const DAY_MS = 24 * 3600000;
const SCORE = RULES.score;

export type ScoreAnswer = { isInStock: boolean | null; at: Date | string };

export type CycleFood = {
  quantity?: string | null;
  boughtDates?: string[] | null;
  frequencyDays?: number | null;
};

export type CycleSource = "declared" | "rhythm" | "pack" | "fallback";

export type CycleEstimate = { source: CycleSource; days: number; trust: number };

export const cleanFrequencyDays = (value: unknown): number | null | undefined => {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value)) return undefined;
  const { min, max } = SCORE.frequencyDays;
  return value >= min && value <= max ? value : undefined;
};

export const cycleEstimates = (food: CycleFood): CycleEstimate[] => {
  const { trust } = SCORE;
  const estimates: CycleEstimate[] = [];
  if (food.frequencyDays) {
    estimates.push({ source: "declared", days: food.frequencyDays, trust: trust.declared });
  }
  const gap = buyGapDays(food.boughtDates);
  if (gap !== null && gap > 0) {
    const gaps = (food.boughtDates?.length ?? 1) - 1;
    estimates.push({ source: "rhythm", days: gap, trust: trust.perPurchaseGap * gaps });
  }
  if (estimates.length > 0) return estimates;
  if ((packSize(food.quantity) ?? 0) >= RULES.swipe.bigPackSize) {
    estimates.push({ source: "pack", days: SCORE.bigPackCycleDays, trust: trust.pack });
  }
  estimates.push({ source: "fallback", days: SCORE.defaultCycleDays, trust: trust.fallback });
  return estimates;
};

export const cycleOf = (food: CycleFood) => {
  const estimates = cycleEstimates(food);
  const total = estimates.reduce((sum, estimate) => sum + estimate.trust, 0);
  const logDays = estimates.reduce((sum, estimate) => sum + estimate.trust * Math.log(estimate.days), 0);
  const days = Number(Math.exp(logDays / total).toFixed(2));
  const known = estimates.some((estimate) => estimate.source === "declared" || estimate.source === "rhythm");
  return { days, known, estimates };
};

export const halfLifeDays = (cycleDays: number) =>
  Math.max(SCORE.minHalfLifeDays, cycleDays * SCORE.halfLifeShare);

export const scoreOf = (answers: ScoreAnswer[], halfLife: number) => {
  if (answers.length === 0) return 1;
  const times = answers.map((answer) => new Date(answer.at).getTime());
  const latest = Math.max(...times);
  let total = 0;
  let inStock = 0;
  answers.forEach((answer, index) => {
    const weight = 0.5 ** ((latest - times[index]!) / (halfLife * DAY_MS));
    total += weight;
    if (answer.isInStock) inStock += weight;
  });
  return Number((inStock / total).toFixed(2));
};

export const scoreFood = (food: CycleFood, answers: ScoreAnswer[]) =>
  scoreOf(answers, halfLifeDays(cycleOf(food).days));

export const explainScore = (food: CycleFood, answers: ScoreAnswer[]) => {
  const cycle = cycleOf(food);
  const halfLife = halfLifeDays(cycle.days);
  return {
    cycleDays: cycle.days,
    halfLifeDays: Number(halfLife.toFixed(2)),
    estimates: cycle.estimates,
    answers: answers.length,
    score: scoreOf(answers, halfLife),
  };
};
