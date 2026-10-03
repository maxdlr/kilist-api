import { Router } from "express";
import browseFoods from "../controllers/browseFoods";
import buyFood from "../controllers/buyFood";

const router = Router();

router.get("/browse", [browseFoods]);
router.post("/buy", [buyFood]);

export default router;
