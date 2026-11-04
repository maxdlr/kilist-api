import dotenv from "dotenv";
import "reflect-metadata";

dotenv.config({ path: "../../.env" });

import registerGlobals from "@/services/registerGlobals";
registerGlobals();

import routes from "@/routes";
import setCors from "@/services/cors";
import { AppDataSource } from "@/services/database/datasource";
import { loadFixtures } from "@/services/fixtures";
import { requestLogger } from "@/services/requestLogger";
import serviceErrorHandler from "@/services/serviceErrorHandlers";
import wrapRoutesHandlers from "@/services/wrapRoutesHandlers";
import printStartupInfo from "@/utils/printStartupInfo";
import cookieParser from "cookie-parser";
import express from "express";
import parseQuery from "@/middlewares/parseQuery";

/**
 * 0 - Init Express
 */
const app = express();
const port =
  process.env.NODE_ENV === "test" ? 0 : process.env.BACK_PORT || 8080;

/**
 * 2 - Cors
 */
app.use((req: any, res, next) => {
  setCors(req, res);
  return req.method === "OPTIONS" ? res.sendStatus(200) : next();
});

/**
 * 3 - Cookie Parser
 */
app.use(cookieParser(process.env.COOKIE_SECRET));

/**
 * 4 - Body Parser
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * QueryParser
 */

app.use(parseQuery);

/**
 * Event Emitters
 */

/**
 * 6 - Routes
 */
app.use(requestLogger);
wrapRoutesHandlers(routes);
app.use("/api", routes);

/**
 * Error Management
 */
app.use(serviceErrorHandler);

/**
 * TypeOrm
 *
 * In containerized deployments the database may not accept connections the
 * instant this process starts - depends_on only waits for the DB container to
 * start, not for MariaDB to finish booting and register its network alias.
 * Retry with a fixed backoff so the API waits for the DB instead of dying on
 * the first failed connection.
 */
const DB_CONNECT_MAX_RETRIES = 10;
const DB_CONNECT_RETRY_DELAY_MS = 3000;

const initDatabaseWithRetry = async (): Promise<void> => {
  for (let attempt = 1; attempt <= DB_CONNECT_MAX_RETRIES; attempt++) {
    try {
      await AppDataSource.initialize();
      await loadFixtures();
      return;
    } catch (error) {
      const isLastAttempt = attempt === DB_CONNECT_MAX_RETRIES;
      console.error(
        `Database connection failed (attempt ${attempt}/${DB_CONNECT_MAX_RETRIES})` +
          (isLastAttempt
            ? ""
            : `, retrying in ${DB_CONNECT_RETRY_DELAY_MS}ms...`),
      );
      if (isLastAttempt) {
        console.trace(error);
        return;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, DB_CONNECT_RETRY_DELAY_MS),
      );
    }
  }
};

void initDatabaseWithRetry();

/**
 * Listener
 */
app.listen(port, () => printStartupInfo(port, true));
