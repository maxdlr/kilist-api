import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import addFoodHistory from "../controllers/addFoodHistory";

const router = Router();

router.post("/add", authenticate, addFoodHistory);

export default router;
