import { Router } from "express";
import browseFoods from "../controllers/browseFoods";

const router = Router();

router.get("/browse", [browseFoods]);

export default router;
