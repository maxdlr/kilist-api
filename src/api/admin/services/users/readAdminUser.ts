import ticketBalance from "@/api/prizes/services/ticketBalance";
import FoodEntity from "@/entities/FoodEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import ListEntity from "@/entities/ListEntity";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import UserEntity from "@/entities/UserEntity";
import UserRepository from "@/repositories/UserRepository";
import findManager from "@/utils/findManager";
import { EntityManager, IsNull, MoreThan } from "typeorm";
import { SKIN_PRIZES, skinName } from "../../helpers";
import recentActions from "../actions/recentActions";
import lastActiveByUser from "./lastActiveByUser";
import loadUser from "./loadUser";

const readAdminUser = async (id: number, manager?: EntityManager) => {
  const m = findManager(UserRepository, manager);
  const user = await loadUser(id, m);
  const householdId = user.household.id;

  const [answers, trips, points, unlocks, sessions, lastActive, members, foods, lists, householdTrips] = await Promise.all([
    m.count(FoodHistoryEntity, { where: { user: { id } } }),
    m.count(ShopListEntity, { where: { user: { id } } }),
    ticketBalance(id, m),
    m.find(UnlockEntity, { where: { user: { id } }, order: { createdAt: "ASC" } }),
    m.count(RefreshTokenEntity, { where: { userId: id, revokedOn: IsNull(), expireOn: MoreThan(new Date()) } }),
    lastActiveByUser([id], m),
    m.count(UserEntity, { where: { household: { id: householdId } } }),
    m.count(FoodEntity, { where: { household: { id: householdId } } }),
    m.count(ListEntity, { where: { household: { id: householdId } } }),
    m.count(ShopListEntity, { where: { household: { id: householdId } } }),
  ]);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    type: user.type,
    skin: user.skin,
    language: user.language,
    deviceLanguage: user.deviceLanguage,
    createdAt: user.createdAt,
    lastActive: lastActive.get(id) ?? null,
    stats: { answers, trips, points, sessions },
    household: { id: householdId, name: user.household.name ?? null, members, foods, lists, trips: householdTrips },
    unlocks: unlocks.map((unlock) => ({ prizeId: unlock.prizeId, source: unlock.source, at: unlock.createdAt })),
    skins: SKIN_PRIZES.map((prize) => ({
      prizeId: prize.id,
      skin: prize.skin,
      name: skinName(prize.skin),
      price: prize.price,
      owned: prize.price === 0 || unlocks.some((unlock) => unlock.prizeId === prize.id),
    })),
    actions: await recentActions("user", id, m),
  };
};

export default readAdminUser;
