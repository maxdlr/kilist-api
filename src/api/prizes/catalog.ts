export type Prize = {
  id: string;
  kind: "skin";
  skin: string;
  price: number;
};

export const PREMIUM_FOR_EVERYONE = false;

export const SWIPE_TICKETS = 10;
export const SPEED_BONUS_TICKETS = 5;
export const SPEED_WINDOW_MS = 2000;
export const PAID_SWIPES_PER_DAY = 10;

export const PRIZES: Prize[] = [
  { id: "skin:arcade", kind: "skin", skin: "arcade", price: 0 },
  { id: "skin:roast", kind: "skin", skin: "roast", price: 500 },
  { id: "skin:versus", kind: "skin", skin: "versus", price: 500 },
  { id: "skin:calm", kind: "skin", skin: "calm", price: 0 },
];

export const findPrize = (id: string) => PRIZES.find((prize) => prize.id === id);

export const prizeForSkin = (skin: string) =>
  PRIZES.find((prize) => prize.kind === "skin" && prize.skin === skin);
