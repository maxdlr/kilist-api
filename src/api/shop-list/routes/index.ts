import { Router } from "express";
import editShopList from "../controllers/editShopList";
import readShopList from "../controllers/readShopList";
import addShopList from "../controllers/addShopList";

const router = Router();

// router.get("/foods", [browseShopFoods]);
router.get("/:id", [readShopList]);

router.post("/start", [addShopList]);

router.put("/edit", [editShopList]);

export default router;
