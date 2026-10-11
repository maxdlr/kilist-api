import { Router } from "express";
import buy from "../controllers/buy";
import snooze from "../controllers/snooze";
import startSession from "../controllers/startSession";
import browseShopFoods from "../controllers/browseShopFoods";

const router = Router();

router.get("/foods", [browseShopFoods]);

router.post("/buy", [buy]);
router.post("/snooze", [snooze]);
router.post("/session/start", [startSession]);

export default router;
