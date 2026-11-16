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

export const swipePay = (paidBefore: number, firstGame: boolean) => {
  const { deckSize, firstDeckSize } = RULES.swipe;
  const first = firstGame ? firstDeckSize : deckSize;
  const game = paidBefore < first ? 0 : 1 + Math.floor((paidBefore - first) / deckSize);
  const factor = 2 ** game;
  return {
    perSwipe: Math.floor(SWIPE_TICKETS / factor),
    speedBonus: Math.floor(SPEED_BONUS_TICKETS / factor),
  };
};

export const PRIZES: Prize[] = [
  { id: "skin:calm", kind: "skin", skin: "calm", price: 0 },
  { id: "skin:roast", kind: "skin", skin: "roast", price: 5000 },
  { id: "skin:versus", kind: "skin", skin: "versus", price: 5000, accountOnly: true },
];

export const findPrize = (id: string) => PRIZES.find((prize) => prize.id === id);

export const prizeForSkin = (skin: string) =>
  PRIZES.find((prize) => prize.kind === "skin" && prize.skin === skin);
