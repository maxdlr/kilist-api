import findFoodIcon from "@/api/food-bank/findFoodIcon";
import { FOOD_ICON_ALIASES } from "@/api/food-bank/foodIconAliases";
import calculateInStockScore from "@/api/foodHistories/services/calculateInStockScore";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FrequencyEntity from "@/entities/FrequencyEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import ListRepository from "@/repositories/ListRepository";
import ensureAdminUser from "@/services/ensureAdminUser";
import { makeFakeUsers } from "@/services/fakeUsers";
import generateJoinCode from "@/utils/generateJoinCode";
import { randomElement } from "@/helpers/random";
import { faker } from "@faker-js/faker";
import { randomInt } from "crypto";
import { EntityManager } from "typeorm";

// --- Helpers ---

const ensureHousehold = async (
  manager: EntityManager,
): Promise<HouseholdEntity> => {
  const existing = await manager.findOne(HouseholdEntity, { where: {} });
  if (existing) return existing;

  const household = new HouseholdEntity();
  household.name = "Dev Household";
  household.joinCode = generateJoinCode();
  return await manager.save(HouseholdEntity, household);
};

// const makeUsers = async (
//   manager: EntityManager,
//   count: number,
// ): Promise<UserEntity[]> => {
//   return await Promise.all(
//     Array.from({ length: count }).map(async () => {
//       const user = new UserEntity();
//       user.username = faker.internet.username();
//       user.email = faker.internet.email();
//       user.password = "password";
//       user.description = faker.lorem.paragraph(2);
//       return await manager.save(UserEntity, user);
//     }),
//   );
// };

const makeLists = async (
  manager: EntityManager,
  household: HouseholdEntity,
  count: number,
): Promise<ListEntity[]> => {
  const foodItems = await manager.getRepository(FoodEntity).find();
  const lists = await Promise.all(
    Array.from({ length: count }).map(async () => {
      const list = new ListEntity();
      list.title = randomElement([faker.lorem.sentence(), faker.lorem.word()]);
      list.foods = foodItems;
      list.description = randomElement([faker.lorem.paragraph(2), undefined]);
      list.household = household;
      return list;
    }),
  );

  return manager.save(ListEntity, lists);
};

const makeFoods = async (
  manager: EntityManager,
  household: HouseholdEntity,
  // foodCategories: () => Promise<FoodCategoryEntity[]>,
  // foodHistories: () => Promise<FoodHistoryEntity[]>,
  count: number = 20,
): Promise<FoodEntity[]> => {
  // const histories = await foodHistories();

  const names = faker.helpers
    .shuffle(Object.values(FOOD_ICON_ALIASES).map((aliases) => aliases[0]!))
    .slice(0, count)
    .map((alias) => alias.charAt(0).toUpperCase() + alias.slice(1));

  const foods = manager.create(
    FoodEntity,
    names.map((name) => {
      const food = new FoodEntity();
      food.name = name;
      food.icon = findFoodIcon(name) ?? null;
      food.inStockScore = 1;
      food.description = faker.food.description();
      food.household = household;
      return food;
    }),
  );
  return await manager.save(foods);
};

const makeFoodHistories = async (
  manager: EntityManager,
  count: number = 10,
): Promise<FoodHistoryEntity[]> => {
  const foods = await manager.getRepository(FoodEntity).find();
  let histories: FoodHistoryEntity[] = [];

  foods.forEach((food) => {
    histories = histories.concat(
      manager.create(
        FoodHistoryEntity,
        Array.from({ length: count }).map(() => {
          const history = new FoodHistoryEntity();
          history.food = food;
          history.isInStock = faker.datatype.boolean();
          history.createdAt = faker.date.past();
          history.updatedAt = faker.date.recent();
          return history;
        }),
      ),
    );
  });

  return await manager.save(histories);
};

const makeFrequencies = async (
  manager: EntityManager,
  household: HouseholdEntity,
  count: number = 20,
): Promise<void> => {
  const foods = await manager.getRepository(FoodEntity).find();
  const frequencies = manager.create(
    FrequencyEntity,
    Array.from({ length: count }).map(() => {
      const frequency = {
        food: randomElement(foods),
        nextBoughtFood: randomElement(foods),
        household,
      };
      return frequency;
    }),
  );
  await manager.save(FrequencyEntity, frequencies);
};

// --- Public API ---

export const loadFixtures = async (): Promise<void> => {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    return;
  }

  await ListRepository.manager.transaction(async (manager) => {
    await manager.createQueryBuilder().delete().from(ListEntity).execute();
    await manager.createQueryBuilder().delete().from(FoodEntity).execute();
    await manager.createQueryBuilder().delete().from(UserEntity).execute();
    await manager.createQueryBuilder().delete().from(HouseholdEntity).execute();

    const household = await ensureHousehold(manager);

    await makeFoods(manager, household, randomInt(20, 400));
    await makeFoodHistories(manager);
    await makeFrequencies(manager, household, randomInt(50, 1000));

    const foodsWithHistories = await manager.getRepository(FoodEntity).find({
      relations: ["foodHistories"],
    });

    for await (const food of foodsWithHistories) {
      food.inStockScore = calculateInStockScore(food.foodHistories || []);
      await manager.save(FoodEntity, food);
    }

    await ensureAdminUser(household, manager);
    await makeLists(manager, household, 1);
    await makeFakeUsers(manager);

    console.log(`Fixtures loaded (${isDev ? "development" : "production"})`);
  });
};
