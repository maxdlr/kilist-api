import { Router } from "express";
import rateLimit from "express-rate-limit";
import browseNews from "../controllers/browseNews";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", limiter, [browseNews]);

export default router;
