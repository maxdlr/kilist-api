import { Router } from "express";
import rateLimit from "express-rate-limit";
import browseNews from "../controllers/browseNews";
import postNewsEvent from "../controllers/postNewsEvent";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", limiter, [browseNews]);

const eventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/:id/events", eventLimiter, [postNewsEvent]);

export default router;
