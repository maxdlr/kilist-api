import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "mariadb",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.APP_NAME,
  synchronize: process.env.NODE_ENV !== "production",
  logging: false,
  entities: [__dirname + "/../../entities/**/*.{ts,js}"],
  migrations: [__dirname + "/../../migrations/**/*.{ts,js}"],
  subscribers: [],
  timezone: "Europe/Paris",
});
