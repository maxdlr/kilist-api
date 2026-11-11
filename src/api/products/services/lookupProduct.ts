import type { ProfileId } from "@/api/food-bank/profiles";
import { Lang } from "@/i18n";
import { basicName, dietTags, ProductFacts, productIcon, productQuantity } from "../helpers";

export type Product = { name: string; icon?: string; tags: ProfileId[]; quantity?: string };

const SOURCES = [
  "https://world.openfoodfacts.org",
  "https://world.openpetfoodfacts.org",
  "https://world.openbeautyfacts.org",
  "https://world.openproductsfacts.org",
];
const FIELDS = (lang: Lang) =>
  [
    "product_name",
    `product_name_${lang}`,
    "generic_name",
    `generic_name_${lang}`,
    "brands",
    "categories_tags",
    `categories_tags_${lang}`,
    "allergens_tags",
    "ingredients_tags",
    "quantity",
    "product_quantity",
    "product_quantity_unit",
  ].join(",");
const TIMEOUT_MS = 6000;
const CACHE_MAX = 2000;

const cache = new Map<string, Product | null>();

const userAgent = () => {
  const contact = process.env.EMAIL_SUPPORT?.trim();
  return contact ? `Kilist/1.0 (${contact})` : "Kilist/1.0";
};

const remember = (key: string, product: Product | null) => {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, product);
  return product;
};

const readFrom = async (source: string, barcode: string, lang: Lang): Promise<Product | null | "down"> => {
  const response = await fetch(`${source}/api/v2/product/${barcode}.json?fields=${FIELDS(lang)}`, {
    headers: { "User-Agent": userAgent() },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);

  if (!response) return "down";
  if (response.status === 404) return null;
  if (!response.ok) return "down";

  const body = (await response.json().catch(() => null)) as { product?: ProductFacts } | null;
  const name = body?.product ? basicName(body.product, lang) : null;
  if (!body?.product || !name) return null;

  return {
    name,
    icon: productIcon(body.product, lang, name),
    tags: dietTags(body.product),
    quantity: productQuantity(body.product),
  };
};

const lookupProduct = async (barcode: string, lang: Lang): Promise<Product | null> => {
  const key = `${lang}:${barcode}`;
  if (cache.has(key)) return cache.get(key)!;

  const [main, ...others] = SOURCES;
  const first = await readFrom(main!, barcode, lang);
  if (first === "down") throw UserError(503, "product.unavailable");
  if (first) return remember(key, first);

  let everyoneAnswered = true;
  for (const source of others) {
    const found = await readFrom(source, barcode, lang);
    if (found === "down") everyoneAnswered = false;
    else if (found) return remember(key, found);
  }

  return everyoneAnswered ? remember(key, null) : null;
};

export default lookupProduct;
