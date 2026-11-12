import { RULES } from "@/api/catalog/rules";

export type Prize = {
  id: string;
  kind: "skin";
  skin: string;
  price: number;
  accountOnly?: boolean;
};

export const PREMIUM_FOR_EVERYONE = false;

export const SWIPE_TICKETS = RULES.tickets.perSwipe;
export const SPEED_BONUS_TICKETS = RULES.tickets.speedBonus;
export const SPEED_WINDOW_MS = RULES.tickets.speedWindowMs;
export const PAID_SWIPES_PER_DAY = RULES.tickets.paidSwipesPerDay;

export const PRIZES: Prize[] = [
  { id: "skin:calm", kind: "skin", skin: "calm", price: 0 },
  { id: "skin:roast", kind: "skin", skin: "roast", price: 1000 },
  { id: "skin:versus", kind: "skin", skin: "versus", price: 1000, accountOnly: true },
  { id: "skin:arcade", kind: "skin", skin: "arcade", price: 0 },
];

export const findPrize = (id: string) => PRIZES.find((prize) => prize.id === id);

export const prizeForSkin = (skin: string) =>
  PRIZES.find((prize) => prize.kind === "skin" && prize.skin === skin);
