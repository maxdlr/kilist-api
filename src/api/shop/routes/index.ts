import { Router } from "express";
import editShopFoods from "../controllers/editShopFoods";
import readSession from "../controllers/readSession";
import startSession from "../controllers/startSession";

const router = Router();

// router.get("/foods", [browseShopFoods]);
router.get("/session/:id", [readSession]);

router.post("/session/start", [startSession]);

router.put("/foods/edit", [editShopFoods]);

export default router;
