import authenticate from "@/middlewares/authenticate";
import { Router } from "express";
import postImport from "../controllers/postImport";
import postSync from "../controllers/postSync";

const router = Router();

router.post("/", authenticate, [postSync]);
router.post("/import", authenticate, [postImport]);

export default router;
