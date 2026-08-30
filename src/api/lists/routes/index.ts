import { Router } from "express";
import browseLists from "../controllers/browseLists";

const router = Router();

router.get("/browse", [browseLists]);

export default router;
