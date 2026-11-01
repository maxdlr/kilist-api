import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import browseFoods from "../controllers/browseFoods";
import browseSwipeFoods from "../controllers/browseSwipeFoods";
import editFoods from "../controllers/editFoods";

const router = Router();

router.get("/browse", authenticate, [browseFoods]);
router.get("/swipe/browse", authenticate, [browseSwipeFoods]);
router.put("/swipe/edit/:id", authenticate, [editFoods]);

export default router;
