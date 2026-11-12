export const RULES = {
  suggestions: {
    everyDays: 2,
    retryDays: 30,
    maxDeclines: 2,
  },
  swipe: {
    deckSize: 10,
    eligibleBelow: 0.75,
    restHours: 24,
    staleDays: 7,
    bigPackStaleDays: 10,
    bigPackSize: 1000,
    historyLimit: 8,
    onboardingScore: 0.5,
  },
  tickets: {
    perSwipe: 10,
    speedBonus: 5,
    speedWindowMs: 2000,
    paidSwipesPerDay: 10,
    payWindowHours: 24,
  },
  shop: {
    snoozeHours: 24,
    sameTripMinutes: 30,
  },
  products: {
    maxBarcodes: 20,
    quantityLength: 40,
  },
};

export type Rules = typeof RULES;
