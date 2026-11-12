import { FOOD_BANKS } from "@/api/food-bank/foodBank";
import { EATER_PROFILES } from "@/api/food-bank/profiles";
import { ALWAYS_EMAIL, NOTIFICATION_EVENTS } from "@/api/notifications/catalog";
import { RULES } from "@/api/catalog/rules";
import { PRIZES } from "@/api/prizes/catalog";
import { Request, Response } from "express";

const readCatalog = (_req: Request, res: Response) =>
  res.status(200).json({
    foodBanks: FOOD_BANKS,
    profiles: EATER_PROFILES,
    prizes: PRIZES,
    rules: RULES,
    notifications: { events: NOTIFICATION_EVENTS, alwaysEmail: ALWAYS_EMAIL },
  });

export default readCatalog;
