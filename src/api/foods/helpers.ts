import { RULES } from "@/api/catalog/rules";
import FoodEntity from "@/entities/FoodEntity";
import { FOOD_ICON_ALIASES } from "@/api/food-bank/foodIconAliases";

export type ScannedProduct = { barcode?: unknown; icon?: unknown; quantity?: unknown };

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

export const isBarcode = (value: unknown): value is string =>
  typeof value === "string" && /^\d{8,14}$/.test(value);

export const productChanges = (
  food: Pick<FoodEntity, "barcodes" | "quantity" | "icon">,
  product?: ScannedProduct | null,
): Partial<Pick<FoodEntity, "barcodes" | "quantity" | "icon">> => {
  if (!product || typeof product !== "object") return {};
  const changes: Partial<Pick<FoodEntity, "barcodes" | "quantity" | "icon">> = {};
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

  return changes;
};
