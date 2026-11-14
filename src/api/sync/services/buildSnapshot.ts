import buildDashboard from "@/api/dashboard/services/buildDashboard";
import { hideJoinCode, visibleJoinCode } from "@/api/households/helpers";
import findHouseholdMembers from "@/api/households/services/findHouseholdMembers";
import findList from "@/api/lists/services/findList";
import prizeCounter from "@/api/prizes/services/prizeCounter";
import findShopList from "@/api/shop-list/services/findShopList";
import findAllSwipeLists from "@/api/swipe-list/services/findAllSwipeLists";
import findUser from "@/api/users/services/findUser";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import FrequencyEntity from "@/entities/FrequencyEntity";
import { SwipeListStatus } from "@/entities/SwipeListEntity";
import TicketEntryEntity, { TicketReason } from "@/entities/TicketEntryEntity";
import UserEntity from "@/entities/UserEntity";
import { EntityManager, IsNull, MoreThan, Not, Or } from "typeorm";

const RECENT_SWIPES_MS = 48 * 3600000;

const buildSnapshot = async (authUser: UserEntity, m: EntityManager) => {
  const householdId = authUser.household.id;
  const user = await findUser({ id: authUser.id }, false, m);

  const members = await findHouseholdMembers(householdId, m);
  const mainList = await findList({ isMain: true, household: { id: householdId } }, m).catch(
    () => null,
  );

  const foods = await m.find(FoodEntity, {
    where: { household: { id: householdId } },
    loadRelationIds: { relations: ["lists"] },
    order: { id: "ASC" },
  });

  const histories = await m.find(FoodHistoryEntity, {
    where: { food: { household: { id: householdId } } },
    loadRelationIds: { relations: ["food"] },
    order: { createdAt: "ASC", id: "ASC" },
  });
  const historiesByFood = new Map<number, { isInStock: boolean | null; at: Date }[]>();
  for (const history of histories) {
    const foodId = history.food as unknown as number;
    historiesByFood.set(foodId, [
      ...(historiesByFood.get(foodId) ?? []),
      { isInStock: history.isInStock, at: history.createdAt as Date },
    ]);
  }

  const frequencies = await m
    .createQueryBuilder(FrequencyEntity, "frequency")
    .innerJoin("frequency.food", "food")
    .select("frequency.foodId", "foodId")
    .addSelect("frequency.nextBoughtFoodId", "nextFoodId")
    .addSelect("COUNT(*)", "count")
    .where("food.householdId = :householdId", { householdId })
    .andWhere("frequency.nextBoughtFoodId IS NOT NULL")
    .groupBy("frequency.foodId")
    .addGroupBy("frequency.nextBoughtFoodId")
    .orderBy("frequency.foodId", "ASC")
    .addOrderBy("frequency.nextBoughtFoodId", "ASC")
    .getRawMany<{ foodId: number; nextFoodId: number; count: string | number }>();

  const sessions = await findAllSwipeLists(
    {
      loadRelationIds: false,
      where: {
        household: { id: householdId },
        status: SwipeListStatus.COMPLETED,
        endedAt: Not(IsNull()),
      },
    },
    m,
  );

  const openList = await findShopList(
    {
      household: { id: householdId },
      endedAt: Or(IsNull(), MoreThan(new Date())),
    },
    m,
  );

  const { shopLists, swipes } = await buildDashboard(householdId, m);

  const prizes = await prizeCounter(authUser.id, m, authUser.type === "admin");

  const recentSwipes = await m.find(TicketEntryEntity, {
    where: {
      user: { id: authUser.id },
      reason: TicketReason.SWIPE,
      createdAt: MoreThan(new Date(Date.now() - RECENT_SWIPES_MS)),
    },
    order: { createdAt: "ASC", id: "ASC" },
  });

  return {
    user: hideJoinCode(user),
    household: {
      id: authUser.household.id,
      name: authUser.household.name,
      joinCode: visibleJoinCode(user, authUser.household),
      eaterProfiles: user.household.eaterProfiles ?? [],
      declinedSuggestions: user.household.declinedSuggestions ?? {},
      members: members.map((member) => ({
        id: member.id,
        username: member.username,
        type: member.type,
      })),
    },
    mainList: mainList && {
      id: mainList.id,
      title: mainList.title,
      description: mainList.description,
      isMain: mainList.isMain,
    },
    foods: foods.map((food) => ({
      id: food.id,
      name: food.name,
      description: food.description,
      imageUrl: food.imageUrl,
      icon: food.icon,
      barcodes: food.barcodes ?? [],
      quantity: food.quantity ?? null,
      aisle: food.aisle ?? null,
      inStockScore: food.inStockScore,
      snoozedUntil: food.snoozedUntil,
      lastBoughtAt: food.lastBoughtAt,
      boughtDates: food.boughtDates ?? [],
      lists: food.lists,
      histories: historiesByFood.get(food.id) ?? [],
    })),
    frequencies: frequencies.map((row) => ({
      foodId: Number(row.foodId),
      nextFoodId: Number(row.nextFoodId),
      count: Number(row.count),
    })),
    playedAt: sessions.map((session) => session.endedAt as Date),
    openShopList:
      openList && openList.startFoods.length > 0
        ? {
            id: openList.id,
            startFoodIds: (openList.startFoods as FoodEntity[]).map((food) => food.id),
            boughtFoodIds: (openList.boughtFoods as FoodEntity[]).map((food) => food.id),
            buyLog: openList.buyLog ?? [],
            startedAt: openList.startedAt ?? null,
          }
        : null,
    dashboard: { shopLists, swipes },
    prizes,
    recentSwipes: recentSwipes.map((entry) => ({
      foodId: entry.foodId,
      at: entry.createdAt as Date,
    })),
  };
};

export default buildSnapshot;
