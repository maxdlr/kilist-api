import "reflect-metadata";
import { DataSource } from "typeorm";
import FoodEntity from "@/entities/FoodEntity";
import UserEntity from "@/entities/UserEntity";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import FoodCategoryEntity from "@/entities/FoodCategory";
import ListEntity from "@/entities/ListEntity";
import FrequencyEntity from "@/entities/FrequencyEntity";
import FoodHistoryEntity from "@/entities/FoodHistoryEntity";
import ShopListEntity from "@/entities/ShopListEntity";
import SwipeListEntity from "@/entities/SwipeListEntity";
import HouseholdEntity from "@/entities/HouseholdEntity";
import TicketEntryEntity from "@/entities/TicketEntryEntity";
import UnlockEntity from "@/entities/UnlockEntity";
import AdminJobRunEntity from "@/entities/AdminJobRunEntity";
import AdminActionEntity from "@/entities/AdminActionEntity";
import EmailLogEntity from "@/entities/EmailLogEntity";
import RaceEntity from "@/entities/RaceEntity";
import RaceRunEntity from "@/entities/RaceRunEntity";
import SyncOpEntity from "@/entities/SyncOpEntity";

export const AppDataSource = new DataSource({
  type: "mariadb",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.APP_NAME,
  // Auto-create/update schema from entities. Normally off in production, but
  // can be force-enabled via DB_SYNC=true (used for the throwaway beta, where
  // there are no migrations yet). Switch DB_SYNC off once real migrations exist.
  synchronize:
    process.env.NODE_ENV !== "production" || process.env.DB_SYNC === "true",
  logging: false,
  entities: [
    FoodEntity,
    UserEntity,
    RefreshTokenEntity,
    FoodHistoryEntity,
    FoodCategoryEntity,
    ListEntity,
    FrequencyEntity,
    ShopListEntity,
    SwipeListEntity,
    HouseholdEntity,
    TicketEntryEntity,
    UnlockEntity,
    AdminJobRunEntity,
    AdminActionEntity,
    EmailLogEntity,
    RaceEntity,
    RaceRunEntity,
    SyncOpEntity,
  ],
  migrations: [__dirname + "/../../migrations/**/*.{ts,js}"],
  subscribers: [],
  timezone: "local",
});
