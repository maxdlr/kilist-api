import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import editShopList from "../controllers/editShopList";
import readShopList from "../controllers/readShopList";
import addShopList from "../controllers/addShopList";
import cancelShopList from "../controllers/cancelShopList";

const router = Router();

// router.get("/foods", [browseShopFoods]);
router.get("/:id", authenticate, [readShopList]);

router.post("/start", authenticate, [addShopList]);
router.post("/cancel/:id", authenticate, [cancelShopList]);

router.put("/edit/:id", authenticate, [editShopList]);

export default router;
