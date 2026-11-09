import { Router } from "express";
import rateLimit from "express-rate-limit";
import postInstallStats from "../controllers/postInstallStats";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", limiter, [postInstallStats]);

export default router;
