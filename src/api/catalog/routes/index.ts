import { Router } from "express";
import rateLimit from "express-rate-limit";
import readCatalog from "../controllers/readCatalog";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 1000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", limiter, [readCatalog]);

export default router;
