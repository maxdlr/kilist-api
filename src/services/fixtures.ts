import GroceryItemEntity from "@/entities/GroceryItemEntity";
import GroceryListEntity from "@/entities/GroceryListEntity";
import UserEntity from "@/entities/UserEntity";
import GroceryListRepository from "@/repositories/GroceryListRepository";
import { faker } from "@faker-js/faker";
import { EntityManager } from "typeorm";

const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)] as T;
};

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

const makeUsers = async (
  manager: EntityManager,
  count: number,
): Promise<UserEntity[]> => {
  return await Promise.all(
    Array.from({ length: count }).map(async () => {
      const user = new UserEntity();
      user.username = faker.internet.username();
      user.email = faker.internet.email();
      user.password = "password";
      user.description = faker.lorem.paragraph(2);
      return await manager.save(UserEntity, user);
    }),
  );
};

const seedGroceryLists = async (
  manager: EntityManager,
  users: UserEntity[],
  groceryItems: GroceryItemEntity[],
  count: number,
): Promise<void> => {
  await manager.save(
    GroceryListEntity,
    Array.from({ length: count }).map((_) => {
      const groceryList = new GroceryListEntity();
      groceryList.title = faker.lorem.sentence();
      groceryList.items = [randomElement(groceryItems)];
      groceryList.description = faker.lorem.paragraph(3);
      groceryList.user = randomElement(users);
      return groceryList;
    }),
  );
};

const makeGroceryItems = async (
  manager: EntityManager,
): Promise<GroceryItemEntity[]> => {
  return await manager.save(
    GroceryItemEntity,
    Array.from({ length: 50 }).map(() => {
      const groceryItem = new GroceryItemEntity();
      groceryItem.name = faker.lorem.word();
      groceryItem.description = faker.lorem.sentence();
      groceryItem.image = faker.image.url();
      return groceryItem;
    }),
  );
};

// --- Public API ---

export const loadFixtures = async (): Promise<void> => {
  const isDev = process.env.NODE_ENV === "development";

  await GroceryListRepository.manager.transaction(async (manager) => {
    if (isDev) {
      await manager
        .createQueryBuilder()
        .delete()
        .from(GroceryListEntity)
        .execute();
      await manager.createQueryBuilder().delete().from(UserEntity).execute();
    }

    const admin = await ensureAdminUser(manager);

    const groceryItems = await makeGroceryItems(manager);

    if (isDev) {
      const count = 50;
      const users = [...(await makeUsers(manager, 25)), admin];
      await seedGroceryLists(manager, users, groceryItems, count);
    }

    console.log(`Fixtures loaded (${isDev ? "development" : "production"})`);
  });
};
