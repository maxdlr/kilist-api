import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import addFood from "../controllers/addFood";
import browseFoods from "../controllers/browseFoods";
import browseSwipeFoods from "../controllers/browseSwipeFoods";
import editFoods from "../controllers/editFoods";
import updateFood from "../controllers/updateFood";

const router = Router();

router.get("/browse", authenticate, [browseFoods]);
router.get("/swipe/browse", authenticate, [browseSwipeFoods]);
router.put("/swipe/edit/:id", authenticate, [editFoods]);
router.post("/create", authenticate, [addFood]);
router.put("/edit/:id", authenticate, [updateFood]);

export default router;
