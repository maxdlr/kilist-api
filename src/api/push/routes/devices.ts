import { Router } from "express";
import rateLimit from "express-rate-limit";
import postDevicePushToken from "../controllers/postDevicePushToken";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/push-token", limiter, [postDevicePushToken]);

export default router;
