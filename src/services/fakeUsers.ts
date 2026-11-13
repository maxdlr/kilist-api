import findFoodIcon from "@/api/food-bank/findFoodIcon";
import { FOOD_ICON_ALIASES } from "@/api/food-bank/foodIconAliases";
import { addBoughtDates } from "@/api/foods/helpers";
import calculateInStockScore from "@/api/foodHistories/services/calculateInStockScore";
import createHousehold from "@/api/households/services/createHousehold";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FrequencyEntity from "@/entities/FrequencyEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import ShopListEntity, { ShopListStatus } from "@/entities/ShopListEntity";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import { faker } from "@faker-js/faker";
import { EntityManager } from "typeorm";

const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const PASSWORD = "Password1!";
const ANSWER_TICKETS = 10;

const HOUSEHOLDS: { name: string; members: string[] }[] = [
  { name: "Les Pilleurs", members: ["Camille", "Hugo", "Lea"] },
  { name: "Coloc Belleville", members: ["Ines", "Karim", "Zoe", "Theo"] },
  { name: "Maison Durand", members: ["Julie", "Antoine"] },
  { name: "Tom & Ana", members: ["Tom", "Ana"] },
  { name: "Jonas", members: ["Jonas"] },
  { name: "Sarah", members: ["Sarah"] },
  { name: "The Flat", members: ["Oliver", "Grace"] },
  { name: "Chez Manon", members: ["Manon"] },
  { name: "Household", members: ["Lucas"] },
  { name: "Les Bernard", members: ["Paul", "Claire", "Emma"] },
  { name: "Noah", members: ["Noah"] },
];

const NO_ICON = ["Sopalin", "Pesto", "Tofu", "Liquide vaisselle", "Kombucha"];
const ICON_NAMES = Object.values(FOOD_ICON_ALIASES).map((aliases) => aliases[0]!.charAt(0).toUpperCase() + aliases[0]!.slice(1));
const SKINS = ["calm", "calm", "calm", "arcade", "arcade", "roast", "versus"];

const pick = <T>(list: T[]) => list[faker.number.int({ min: 0, max: list.length - 1 })]!;
const chance = (probability: number) => Math.random() < probability;
const between = (start: number, end: number) => new Date(faker.number.int({ min: start, max: Math.max(start, end) }));

const makeFoods = async (m: EntityManager, household: HouseholdEntity, list: ListEntity) => {
  const names = [
    ...faker.helpers.shuffle(ICON_NAMES).slice(0, faker.number.int({ min: 8, max: 24 })),
    ...faker.helpers.shuffle(NO_ICON).slice(0, faker.number.int({ min: 0, max: 2 })),
  ];
  const foods = await m.save(
    FoodEntity,
    names.map((name) => m.create(FoodEntity, { name, icon: findFoodIcon(name) ?? null, inStockScore: 1, household, description: "" })),
  );
  list.foods = foods;
  await m.save(ListEntity, list);
  return foods;
};

const ROUTE_REACH = 4;

export const makeShoppingRoute = async (m: EntityManager, household: HouseholdEntity, foods: FoodEntity[]) => {
  if (foods.length < 2) return;
  const route = faker.helpers.shuffle(foods);
  const rows = route.flatMap((food, index) =>
    Array.from({ length: Math.min(ROUTE_REACH, route.length - 1) }).flatMap((_, step) => {
      const next = route[(index + step + 1) % route.length]!;
      return Array.from({ length: ROUTE_REACH - step }).map(() =>
        m.create(FrequencyEntity, { food, nextBoughtFood: next, household }),
      );
    }),
  );
  await m.save(FrequencyEntity, rows, { chunk: 200 });
};

const makeActivity = async (m: EntityManager, user: UserEntity, joined: Date, foods: FoodEntity[], household: HouseholdEntity) => {
  if (!chance(0.8) || !foods.length) return 0;

  const lastDay = chance(0.6) ? Date.now() : joined.getTime() + faker.number.int({ min: 1, max: 20 }) * DAY;
  const days = Math.max(1, Math.round((Math.min(lastDay, Date.now()) - joined.getTime()) / DAY));
  const playDays = faker.number.int({ min: 1, max: Math.min(days, 30) });
  const histories: FoodHistoryEntity[] = [];
  for (let day = 0; day < playDays; day++) {
    const at = between(joined.getTime(), Math.min(lastDay, Date.now()));
    for (const food of faker.helpers.shuffle(foods).slice(0, Math.min(10, foods.length))) {
      const answer = Math.random();
      histories.push(
        m.create(FoodHistoryEntity, {
          food,
          user,
          isInStock: answer < 0.1 ? null : answer < 0.55,
          createdAt: new Date(at.getTime() + faker.number.int({ min: 0, max: 5 * MINUTE })),
        }),
      );
    }
  }
  await m.save(FoodHistoryEntity, histories, { chunk: 200 });

  const trips = chance(0.7) ? faker.number.int({ min: 1, max: 6 }) : 0;
  const frequencies: FrequencyEntity[] = [];
  for (let trip = 0; trip < trips; trip++) {
    const start = between(joined.getTime() + DAY, Math.min(lastDay, Date.now()));
    const bought = faker.helpers.shuffle(foods).slice(0, faker.number.int({ min: 2, max: Math.min(10, foods.length) }));
    const buyLog = bought.map((food, index) => ({ foodId: food.id, at: new Date(start.getTime() + index * faker.number.int({ min: 1, max: 4 }) * MINUTE).toISOString() }));
    const suggestionLog = bought.slice(1).map((food) => (chance(0.45) ? { foodId: food.id, taken: true } : { foodId: pick(foods).id, taken: false }));
    await m.save(ShopListEntity, {
      household,
      user,
      startFoods: foods,
      boughtFoods: bought,
      buyLog,
      suggestionLog,
      status: ShopListStatus.COMPLETED,
      endedAt: new Date(new Date(buyLog.at(-1)!.at).getTime() + MINUTE),
      createdAt: start,
    });
    for (const food of bought) {
      food.boughtDates = addBoughtDates(food.boughtDates, [start]);
      await m.update(FoodEntity, food.id, { boughtDates: food.boughtDates });
    }
    bought.slice(1).forEach((food, index) => frequencies.push(m.create(FrequencyEntity, { food: bought[index]!, nextBoughtFood: food, household })));
  }
  if (frequencies.length) await m.save(FrequencyEntity, frequencies);

  return histories.length;
};

export const makeFakeUsers = async (m: EntityManager) => {
  let created = 0;

  for (const home of HOUSEHOLDS) {
    const household = await createHousehold(home.name === "Household" ? undefined : home.name, m);
    const list = await m.findOneOrFail(ListEntity, { where: { household: { id: household.id }, isMain: true } });
    const foods = chance(0.9) ? await makeFoods(m, household, list) : [];
    await makeShoppingRoute(m, household, foods);

    for (const name of home.members) {
      const joined = between(Date.now() - 60 * DAY, Date.now() - 2 * 60 * 60 * 1000);
      const user = m.create(UserEntity, {
        username: name.toLowerCase(),
        email: `${name.toLowerCase()}@kilist.test`,
        household,
        language: pick([null, null, "fr", "fr", "fr", "en"]),
        deviceLanguage: pick(["fr", "fr", "fr", "en", null]),
        skin: "calm",
        createdAt: joined,
      });
      user.password = PASSWORD;
      await m.save(UserEntity, user);

      const answers = await makeActivity(m, user, joined, foods, household);
      const earned = answers * ANSWER_TICKETS;
      if (earned) await m.save(TicketEntryEntity, { user, amount: earned, reason: TicketReason.SWIPE, createdAt: joined });

      const skin = pick(SKINS);
      if (skin !== "arcade" && skin !== "calm") {
        const prizeId = `skin:${skin}`;
        if (earned >= 500 && chance(0.7)) {
          await m.save(UnlockEntity, { user, prizeId, source: "points" });
          await m.save(TicketEntryEntity, { user, amount: -500, reason: TicketReason.REDEEM, prizeId });
        } else {
          await m.save(UnlockEntity, { user, prizeId, source: "gift" });
        }
      }
      await m.update(UserEntity, user.id, { skin });
      created += 1;
    }

    for (const food of foods) {
      const histories = await m.find(FoodHistoryEntity, { where: { food: { id: food.id } } });
      if (histories.length) await m.update(FoodEntity, food.id, { inStockScore: calculateInStockScore(histories) });
    }
  }

  console.log(`${created} fake users created (password: ${PASSWORD})`);
};
