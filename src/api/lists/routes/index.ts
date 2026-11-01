import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import browseLists from "../controllers/browseLists";
import readList from "../controllers/readList";

const router = Router();

router.get("/browse", authenticate, [browseLists]);
router.get("/read", authenticate, [readList]);

export default router;
