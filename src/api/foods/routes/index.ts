import { Router } from "express";
import browseFoods from "../controllers/browseFoods";
import browseSwipeFoods from "../controllers/browseSwipeFoods";
import editFoods from "../controllers/editFoods";

const router = Router();

router.get("/browse", [browseFoods]);
router.get("/swipe/browse", [browseSwipeFoods]);
router.put("/swipe/edit/:id", [editFoods]);

export default router;
