import UserEntity from "@/entities/UserEntity";
import { PREMIUM_FOR_EVERYONE, PRIZES } from "./catalog";

export const userRef = (userId: number) => ({ id: userId }) as UserEntity;

export const buildCounter = (balance: number, owned: Set<string>, isAdmin = false) => ({
  balance,
  premium: PREMIUM_FOR_EVERYONE,
  prizes: PRIZES.map((prize) => {
    const isOwned = prize.price === 0 || owned.has(prize.id);
    return { ...prize, owned: isOwned, wearable: isOwned || isAdmin || PREMIUM_FOR_EVERYONE };
  }),
});
