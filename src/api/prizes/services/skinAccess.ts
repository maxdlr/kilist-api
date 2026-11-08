import { EntityManager } from "typeorm";
import { PREMIUM_FOR_EVERYONE, prizeForSkin } from "../catalog";
import findOwnedPrizeIds from "./findOwnedPrizeIds";

export type SkinAccess = "unknown" | "locked" | "allowed";

const skinAccess = async (
  userId: number,
  skin: string,
  manager?: EntityManager,
  isAdmin = false,
): Promise<SkinAccess> => {
  const prize = prizeForSkin(skin);
  if (!prize) return "unknown";
  if (prize.price === 0 || isAdmin || PREMIUM_FOR_EVERYONE) return "allowed";
  return (await findOwnedPrizeIds(userId, manager)).has(prize.id)
    ? "allowed"
    : "locked";
};

export default skinAccess;
