import { Router } from "express";
import browseLists from "../controllers/browseLists";
import readList from "../controllers/readList";

const router = Router();

router.get("/browse", [browseLists]);
router.get("/read", [readList]);

export default router;
