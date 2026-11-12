import { RULES } from "@/api/catalog/rules";
import findShopList from "@/api/shop-list/services/findShopList";
import FoodEntity from "@/entities/FoodEntity";
import FrequencyEntity from "@/entities/FrequencyEntity";
import FoodRepository from "@/repositories/FoodRepository";
import findManager from "@/utils/findManager";
import { EntityManager } from "typeorm";

const getMostLikelyNextFoods = async (
  foodId: number,
  count: number = 1,
  shopListId?: number,
  manager?: EntityManager,
): Promise<number[] | null> => {
  const m = findManager(FoodRepository, manager);

  if (!foodId) {
    return null;
  }

  const shopList = await findShopList({ id: shopListId }, m);
  const bought = new Set((shopList?.boughtFoods ?? []).map((food) => (food as FoodEntity).id));
  const started = new Set((shopList?.startFoods ?? []).map((food) => (food as FoodEntity).id));

  const frequencies = await m.find(FrequencyEntity, {
    where: { food: { id: foodId } },
    relations: { nextBoughtFood: { lists: true } },
  });

  const now = Date.now();
  const canSuggest = (next: FoodEntity) => {
    if (next.id === foodId || bought.has(next.id)) return false;
    if (next.snoozedUntil && new Date(next.snoozedUntil).getTime() >= now) return false;
    if (!shopList || started.has(next.id)) return next.inStockScore !== 1;
    return (next.lists ?? []).length > 0 && next.inStockScore < RULES.shop.suggestBelow;
  };

  const counts = new Map<number, number>();
  for (const frequency of frequencies) {
    const next = frequency.nextBoughtFood as FoodEntity | null;
    if (next && canSuggest(next)) counts.set(next.id, (counts.get(next.id) ?? 0) + 1);
  }

  return [...counts.keys()]
    .sort((a, b) => counts.get(b)! - counts.get(a)! || a - b)
    .slice(0, count);
};

export default getMostLikelyNextFoods;
