import FoodCategoryEntity from "@/entities/FoodCategory";
import FoodEntity from "@/entities/FoodEntity";
import ListEntity from "@/entities/ListEntity";
import UserEntity from "@/entities/UserEntity";
import ListRepository from "@/repositories/ListRepository";
import { randomElement } from "@/utils/helpers";
import { faker } from "@faker-js/faker";
import { randomInt } from "crypto";
import { EntityManager } from "typeorm";

// --- Helpers ---

const ensureAdminUser = async (manager: EntityManager): Promise<UserEntity> => {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }

  const existing = await manager.findOneBy(UserEntity, { username: "maxdlr" });
  if (existing) return existing;

  const user = new UserEntity();
  user.username = "maxdlr";
  user.email = "contact@maxdlr.com";
  user.password = process.env.ADMIN_PASSWORD;
  user.description = "Creator of this platform";
  user.type = "admin";
  return await manager.save(UserEntity, user);
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

const makeGroceryLists = async (
  manager: EntityManager,
  users: UserEntity[],
  foods: () => Promise<FoodEntity[]>,
  count: number,
): Promise<ListEntity[]> => {
  const lists = await Promise.all(
    Array.from({ length: count }).map(async () => {
      const foodItems = await foods();
      const list = new ListEntity();
      list.title = randomElement([faker.lorem.sentence(), faker.lorem.word()]);
      list.items = foodItems;
      list.description = randomElement([faker.lorem.paragraph(2), undefined]);
      list.user = randomElement(users);
      return list;
    }),
  );

  return manager.save(ListEntity, lists);
};

const makeFoodCategories = async (
  manager: EntityManager,
  count: number = 10,
): Promise<FoodCategoryEntity[]> => {
  const categories = manager.create(
    FoodCategoryEntity,
    Array.from({ length: count }).map(() => {
      const category = new FoodCategoryEntity();
      category.name = faker.word.noun();
      category.description = faker.lorem.sentence();
      return category;
    }),
  );
  return await manager.save(categories);
};

const makeFoods = async (
  manager: EntityManager,
  foodCategories: () => Promise<FoodCategoryEntity[]>,
  count: number = 20,
): Promise<FoodEntity[]> => {
  const categories = await foodCategories();

  const foods = manager.create(
    FoodEntity,
    Array.from({ length: count }).map(() => {
      const food = new FoodEntity();
      food.name = randomElement([
        faker.food.vegetable(),
        faker.food.fruit(),
        faker.food.ingredient(),
        faker.food.meat(),
        faker.food.spice(),
      ]);
      food.inStockScore = faker.number.float({
        min: 0,
        max: 1,
        fractionDigits: 2,
      });
      food.categories = categories;
      food.description = faker.food.description();
      food.imageUrl = faker.image.urlPicsumPhotos();
      return food;
    }),
  );
  return await manager.save(foods);
};

// --- Public API ---

export const loadFixtures = async (): Promise<void> => {
  const isDev = process.env.NODE_ENV === "development";

  await ListRepository.manager.transaction(async (manager) => {
    if (isDev) {
      await manager.createQueryBuilder().delete().from(ListEntity).execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(FoodCategoryEntity)
        .execute();
      await manager.createQueryBuilder().delete().from(FoodEntity).execute();
      await manager.createQueryBuilder().delete().from(UserEntity).execute();
    }

    const foodCategories = () => makeFoodCategories(manager, randomInt(1, 3));
    const foods = () => makeFoods(manager, foodCategories, randomInt(1, 20));

    if (isDev) {
      await makeGroceryLists(
        manager,
        [await ensureAdminUser(manager)],
        foods,
        randomInt(1, 10),
      );
    }

    console.log(`Fixtures loaded (${isDev ? "development" : "production"})`);
  });
};
