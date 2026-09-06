import "reflect-metadata";
import { DataSource } from "typeorm";
import FoodEntity from "@/entities/FoodEntity";
import UserEntity from "@/entities/UserEntity";
import RefreshTokenEntity from "@/entities/RefreshTokenEntity";
import InStockScoreEntity from "@/entities/InStockScoreEntity";
import FoodCategoryEntity from "@/entities/FoodCategory";
import ListEntity from "@/entities/ListEntity";
import FrequencyEntity from "@/entities/FrequencyEntity";

export const AppDataSource = new DataSource({
  type: "mariadb",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.APP_NAME,
  synchronize: process.env.NODE_ENV !== "production",
  logging: false,
  entities: [
    FoodEntity,
    UserEntity,
    RefreshTokenEntity,
    InStockScoreEntity,
    FoodCategoryEntity,
    ListEntity,
    FrequencyEntity,
  ],
  migrations: [__dirname + "/../../migrations/**/*.{ts,js}"],
  subscribers: [],
  timezone: "local",
});
