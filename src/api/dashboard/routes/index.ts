import { Router } from "express";
import getDashboard from "../controllers/getDashboard";

const router = Router();

router.get("/", getDashboard);

export default router;
