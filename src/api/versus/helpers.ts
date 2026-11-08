import RaceRunEntity, { RaceAnswer } from "@/entities/RaceRunEntity";

export const DAY_MS = 24 * 3600000;

export type Verdict = { result: "needed" | "stocked" | "tied"; out: number; in: number };

export const verdictOf = (answers: RaceAnswer[]): Verdict | null => {
  const out = answers.filter((answer) => answer === "out").length;
  const inStock = answers.filter((answer) => answer === "in").length;
  if (out + inStock === 0) return null;
  const result = out > inStock ? "needed" : inStock > out ? "stocked" : "tied";
  return { result, out, in: inStock };
};

export const isDuplicate = (error: unknown) =>
  (error as { code?: string })?.code === "ER_DUP_ENTRY";

export const finished = (runs: RaceRunEntity[]) => runs.filter((run) => run.finishedAt);

export const majorityOf = (runs: RaceRunEntity[], foodId: number): RaceAnswer | null => {
  const answers = runs
    .map((run) => run.answers.find((entry) => entry.foodId === foodId)?.answer)
    .filter((answer): answer is RaceAnswer => answer !== undefined && answer !== "up");
  if (answers.length < 2) return null;
  const verdict = verdictOf(answers);
  if (!verdict || verdict.result === "tied") return null;
  return verdict.result === "needed" ? "out" : "in";
};

export const dayOffset = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);
