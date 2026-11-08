import { PRIZES } from "@/api/prizes/catalog";
import AdminActionEntity from "@/entities/AdminActionEntity";
import FoodEntity from "@/entities/FoodEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import Fuse from "fuse.js";

export const NEEDED_BELOW = 0.375;
export const PAGE_SIZE = 50;

export const idOf = (value: unknown, name = "id") => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw ApiError(`A valid ${name} is required`);
  return id;
};

export const text = (value: unknown, name: string, { optional = false, max = 255 } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (optional) return undefined;
    throw ApiError(`${name} is required`);
  }
  if (typeof value !== "string" || value.trim().length > max) throw ApiError(`${name} must be text up to ${max} characters`);
  return value.trim();
};

export const pageOf = (query: Record<string, unknown>) => {
  const offset = Math.max(0, Number(query.offset) || 0);
  return { offset, limit: PAGE_SIZE };
};

export const SKIN_PRIZES = PRIZES.filter((prize) => prize.kind === "skin");
export const skinName = (skin: string) => skin.charAt(0).toUpperCase() + skin.slice(1);

export const householdLabel = (household: HouseholdEntity) => household.name || `Household ${household.id}`;
export const foodLabel = (food: FoodEntity) => `${food.name} (${food.household?.name || `household ${food.household?.id}`})`;
export const listLabel = (list: ListEntity) => `${list.title} (${list.household?.name || `household ${list.household?.id}`})`;

export const toAction = (row: AdminActionEntity) => ({
  id: row.id,
  summary: row.summary,
  admin: row.admin?.username ?? null,
  targetType: row.targetType,
  targetId: row.targetId,
  at: row.createdAt,
});

const FILLERS = new Set(["with", "and", "of", "the", "a", "avec", "et", "de", "du", "des", "la", "le", "les", "l", "d", "au", "aux", "en"]);

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

export const compact = (text: string) => words(text).filter((word) => !FILLERS.has(word)).join("");

export const rankByName = <T extends { id: number; name: string }>(items: T[], search: string): T[] => {
  const query = compact(search);
  if (!query) return items;

  const scored = new Map<number, number>();
  const entries = items.map((item) => ({ item, key: compact(item.name) }));
  for (const { item, key } of entries) {
    if (key === query) scored.set(item.id, 0);
    else if (key.startsWith(query)) scored.set(item.id, 0.05);
    else if (key.includes(query)) scored.set(item.id, 0.1);
  }

  if (query.length >= 3) {
    const fuse = new Fuse(entries, { keys: ["key"], includeScore: true, threshold: 0.34, ignoreLocation: true });
    for (const result of fuse.search(query)) {
      const key = result.item.key;
      if (Math.min(key.length, query.length) / Math.max(key.length, query.length) < 0.75) continue;
      const id = result.item.item.id;
      const score = 0.2 + (result.score ?? 0);
      if (!scored.has(id) || scored.get(id)! > score) scored.set(id, score);
    }
  }

  return items
    .filter((item) => scored.has(item.id))
    .sort((a, b) => scored.get(a.id)! - scored.get(b.id)! || a.name.localeCompare(b.name));
};
