import authenticate from "@/middlewares/authenticate";
import { Router } from "express";
import postSync from "../controllers/postSync";

const router = Router();

router.post("/", authenticate, [postSync]);

export default router;
