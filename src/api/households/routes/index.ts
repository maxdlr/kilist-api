import authenticate from "@/middlewares/authenticate";
import { Router } from "express";
import readHousehold from "../controllers/readHousehold";
import switchHousehold from "../controllers/switchHousehold";

const router = Router();

// The authenticated user's own household, with its members.
router.get("/me", authenticate, [readHousehold]);

// Move the authenticated user to a different household (join or create).
router.post("/switch", authenticate, [switchHousehold]);

export default router;
