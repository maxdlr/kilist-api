import { cleanAisle } from "@/api/food-bank/aisles";
import { RULES } from "@/api/catalog/rules";
import FoodEntity from "@/entities/FoodEntity";
import { FOOD_ICON_ALIASES } from "@/api/food-bank/foodIconAliases";

export type ScannedProduct = { barcode?: unknown; icon?: unknown; quantity?: unknown; aisle?: unknown };

export const MAX_BARCODES = RULES.products.maxBarcodes;
export const QUANTITY_LENGTH = RULES.products.quantityLength;
export const STALE_DAYS = RULES.swipe.staleDays;
export const BIG_PACK_STALE_DAYS = RULES.swipe.bigPackStaleDays;
const BIG_PACK = RULES.swipe.bigPackSize;

const UNITS: Record<string, number> = { kg: 1000, g: 1, l: 1000, cl: 10, ml: 1 };
const AMOUNT = "(\\d+(?:[.,]\\d+)?)";
const PACK = new RegExp(`(?:(\\d+)\\s*[x×]\\s*)?${AMOUNT}\\s*(kg|g|l|cl|ml)\\b`, "i");

export const packSize = (quantity?: string | null): number | null => {
  const match = quantity?.match(PACK);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  return count * Number(match[2]!.replace(",", ".")) * UNITS[match[3]!.toLowerCase()]!;
};

export const staleDaysFor = (quantity?: string | null) =>
  (packSize(quantity) ?? 0) >= BIG_PACK ? BIG_PACK_STALE_DAYS : STALE_DAYS;

const RHYTHM = RULES.rhythm;
const HOUR_MS = 3600000;

export const addBoughtDates = (dates: string[] | null | undefined, added: (Date | string)[]) => {
  const sorted = [...(dates ?? []), ...added]
    .map((date) => new Date(date).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b);
  const kept: number[] = [];
  for (const time of sorted) {
    const previous = kept[kept.length - 1];
    if (previous !== undefined && time - previous < RHYTHM.sameBuyHours * HOUR_MS) continue;
    kept.push(time);
  }
  return kept.slice(-RHYTHM.keep).map((time) => new Date(time).toISOString());
};

export const buyGapDays = (dates?: string[] | null) => {
  const times = (dates ?? []).map((date) => Date.parse(date)).sort((a, b) => a - b);
  if (times.length < RHYTHM.minPurchases) return null;
  const gaps = times.slice(1).map((time, index) => time - times[index]!).sort((a, b) => a - b);
  const middle = Math.floor(gaps.length / 2);
  const median = gaps.length % 2 ? gaps[middle]! : (gaps[middle - 1]! + gaps[middle]!) / 2;
  return median / (24 * HOUR_MS);
};

export const waitDaysFor = (food: Pick<FoodEntity, "quantity" | "boughtDates">) => {
  const gap = buyGapDays(food.boughtDates);
  return gap === null ? staleDaysFor(food.quantity) : Math.max(RHYTHM.minDays, gap * RHYTHM.share);
};

export const isBarcode = (value: unknown): value is string =>
  typeof value === "string" && /^\d{8,14}$/.test(value);

export const productChanges = (
  food: Pick<FoodEntity, "barcodes" | "quantity" | "icon" | "aisle">,
  product?: ScannedProduct | null,
): Partial<Pick<FoodEntity, "barcodes" | "quantity" | "icon" | "aisle">> => {
  if (!product || typeof product !== "object") return {};
  const changes: Partial<Pick<FoodEntity, "barcodes" | "quantity" | "icon" | "aisle">> = {};
  const barcodes = food.barcodes ?? [];

  if (isBarcode(product.barcode) && !barcodes.includes(product.barcode)) {
    changes.barcodes = [...barcodes, product.barcode].slice(-MAX_BARCODES);
  }
  if (typeof product.quantity === "string" && product.quantity.trim()) {
    changes.quantity = product.quantity.trim().slice(0, QUANTITY_LENGTH);
  }
  if (!food.icon && typeof product.icon === "string" && product.icon in FOOD_ICON_ALIASES) {
    changes.icon = product.icon;
  }
  const aisle = cleanAisle(product.aisle);
  if (!food.aisle && aisle) changes.aisle = aisle;

  return changes;
};
