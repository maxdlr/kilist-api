import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import getDashboard from "../controllers/getDashboard";

const router = Router();

router.get("/", authenticate, getDashboard);

export default router;
