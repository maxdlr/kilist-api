import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import browseLists from "../controllers/browseLists";
import readList from "../controllers/readList";
import removeFoods from "../controllers/removeFoods";

const router = Router();

router.get("/browse", authenticate, [browseLists]);
router.get("/read", authenticate, [readList]);
router.put("/:id/remove-foods", authenticate, [removeFoods]);

export default router;
