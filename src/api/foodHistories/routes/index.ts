import { Router } from "express";
import addFoodHistory from "../controllers/addFoodHistory";

const router = Router();

router.post("/add", addFoodHistory);

export default router;
