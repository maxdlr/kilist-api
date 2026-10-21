import { Router } from "express";
import editShopList from "../controllers/editShopList";
import readShopList from "../controllers/readShopList";
import addShopList from "../controllers/addShopList";
import cancelShopList from "../controllers/cancelShopList";

const router = Router();

// router.get("/foods", [browseShopFoods]);
router.get("/:id", [readShopList]);

router.post("/start", [addShopList]);
router.post("/cancel/:id", [cancelShopList]);

router.put("/edit/:id", [editShopList]);

export default router;
