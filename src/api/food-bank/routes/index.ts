import authenticate from "@/middlewares/authenticate";
import { Router } from "express";
import browseFoodBank from "../controllers/browseFoodBank";

const router = Router();

// Onboarding suggestions: common items not already in the user's main list.
router.get("/browse", authenticate, [browseFoodBank]);

export default router;
