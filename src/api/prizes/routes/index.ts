import authenticate from "@/middlewares/authenticate";
import { Router } from "express";
import browsePrizes from "../controllers/browsePrizes";
import redeem from "../controllers/redeem";

const router = Router();

router.get("/", authenticate, [browsePrizes]);
router.post("/:id/redeem", authenticate, [redeem]);

export default router;
