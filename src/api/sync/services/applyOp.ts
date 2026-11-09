import addOrMergeFood from "@/api/foods/services/addOrMergeFood";
import applySwipe from "@/api/foods/services/applySwipe";
import editFood from "@/api/foods/services/editFood";
import findFood from "@/api/foods/services/findFood";
import removeFoodsFromList from "@/api/lists/services/removeFoodsFromList";
import skinAccess from "@/api/prizes/services/skinAccess";
import applyShopAction from "@/api/shop-list/services/applyShopAction";
import closeShopListIfDone from "@/api/shop-list/services/closeShopListIfDone";
import findShopList from "@/api/shop-list/services/findShopList";
import openShopList from "@/api/shop-list/services/openShopList";
import updateShopList from "@/api/shop-list/services/updateShopList";
import completeSwipeDay from "@/api/swipe-list/services/completeSwipeDay";
import updateUserColumns from "@/api/users/services/updateUserColumns";
import answerRace from "@/api/versus/services/answerRace";
import FoodEntity from "@/entities/FoodEntity";
import UserEntity, { SKIN_PATTERN } from "@/entities/UserEntity";
import { parseTzOffset } from "@/helpers/localDay";
import { isLang } from "@/i18n";
import { EntityManager, IsNull } from "typeorm";
import { MAX_REWARD_AGE_MS, SyncOpInput } from "../helpers";

const raceFallback = (error: unknown) =>
  isApiError(error) && (error.status === 404 || error.code === "race.notInRace");

const applyOp = async (
  user: UserEntity,
  op: SyncOpInput,
  at: Date,
  ids: Record<string, number>,
  m: EntityManager,
): Promise<Record<string, number> | null> => {
  const payload = op.payload ?? {};
  const householdId = user.household.id;
  const withReward = Date.now() - at.getTime() <= MAX_REWARD_AGE_MS;

  const resolve = (value: unknown) => {
    const id = Number(value);
    if (!Number.isInteger(id)) throw ApiError("A valid id is required");
    if (id >= 0) return id;
    const mapped = ids[String(id)];
    if (mapped === undefined) throw Missing(`Unknown temporary id ${id}`);
    return mapped;
  };

  switch (op.type) {
    case "swipe":
      await applySwipe(
        {
          userId: user.id,
          householdId,
          foodId: resolve(payload.foodId),
          isInStock: payload.isInStock,
          at,
          withReward,
        },
        m,
      );
      return null;

    case "swipe.complete":
      await completeSwipeDay(householdId, parseTzOffset(payload.tzOffset), at, m);
      return null;

    case "race.answer": {
      const foodId = resolve(payload.foodId);
      const raceId = Number(payload.raceId);
      if (raceId > 0) {
        try {
          await answerRace(
            user,
            raceId,
            { foodId, answer: payload.answer, ms: payload.ms },
            { at, manager: m, withReward },
          );
          return null;
        } catch (error) {
          if (!raceFallback(error)) throw error;
        }
      }
      await applySwipe(
        {
          userId: user.id,
          householdId,
          foodId,
          isInStock:
            payload.answer === "in" ? true : payload.answer === "out" ? false : null,
          at,
          withReward,
        },
        m,
      );
      return null;
    }

    case "shop.start": {
      const extraFoodIds = (Array.isArray(payload.foodIds) ? payload.foodIds : [])
        .map(Number)
        .filter((id: number) => id > 0 || ids[String(id)] !== undefined)
        .map(resolve);
      const id = await openShopList(householdId, user.id, m, { extraFoodIds, at });
      if (id === null) throw Missing("Nothing to shop for");
      return { [String(payload.tempId)]: id };
    }

    case "shop.clock": {
      const id = resolve(payload.shopListId);
      if (!(await findShopList({ id, household: { id: householdId } }, m))) {
        throw Missing(`ShopList with id ${id} not found`);
      }
      await updateShopList({ id, startedAt: at }, m);
      return null;
    }

    case "shop.buy":
    case "shop.snooze": {
      const shopListId = resolve(payload.shopListId);
      await applyShopAction(
        {
          householdId,
          shopListId,
          foodId: resolve(payload.foodId),
          action: op.type === "shop.buy" ? "buy" : "snooze",
          at,
        },
        m,
      );
      const list = await findShopList({ id: shopListId, household: { id: householdId } }, m);
      if (list) await closeShopListIfDone(list, at, m);
      return null;
    }

    case "shop.cancel": {
      const id = resolve(payload.shopListId);
      const list = await findShopList({ id, household: { id: householdId } }, m);
      if (list && !list.endedAt) await updateShopList({ id, endedAt: at }, m);
      return null;
    }

    case "food.create": {
      const food = await addOrMergeFood(
        householdId,
        resolve(payload.listId),
        {
          name: payload.name,
          description: payload.description,
          fromOnboarding: payload.fromOnboarding,
        },
        m,
      );
      return { [String(payload.tempId)]: food.id };
    }

    case "food.edit": {
      const foodId = resolve(payload.foodId);
      const food = await findFood({ id: foodId, household: { id: householdId } }, m);
      if (!food) throw Missing(`Food with id ${foodId} not found`);
      if (food.editedAt && at < food.editedAt) return null;
      await editFood(
        householdId,
        foodId,
        { name: payload.name, description: payload.description },
        m,
      );
      await m.update(FoodEntity, foodId, { editedAt: at });
      return null;
    }

    case "food.remove": {
      await removeFoodsFromList(
        householdId,
        resolve(payload.listId),
        (Array.isArray(payload.foodIds) ? payload.foodIds : []).map(resolve),
        m,
      );
      const open = await findShopList(
        { household: { id: householdId }, endedAt: IsNull() },
        m,
      );
      if (open) await closeShopListIfDone(open, at, m);
      return null;
    }

    case "me.skin": {
      const skin = payload.skin;
      if (typeof skin !== "string" || !SKIN_PATTERN.test(skin)) {
        throw ApiError("skin must be a lowercase skin id");
      }
      const access = await skinAccess(user.id, skin, m, user.type === "admin");
      if (access === "unknown") throw UserError(400, "skins.unknown");
      if (access === "locked") throw UserError(403, "skins.locked");
      await updateUserColumns(user.id, { skin }, m);
      return null;
    }

    case "me.language": {
      const language = payload.language ?? null;
      if (language !== null && !isLang(language)) {
        throw ApiError("language must be a supported language code or null");
      }
      await updateUserColumns(user.id, { language }, m);
      return null;
    }

    default:
      throw ApiError(`Unknown sync operation ${op.type}`);
  }
};

export default applyOp;
