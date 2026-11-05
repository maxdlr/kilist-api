import authenticate from "@/middlewares/authenticate";
import requireAdmin from "@/middlewares/requireAdmin";
import { Router } from "express";
import browseJobs from "../controllers/browseJobs";
import runJob from "../controllers/runJob";

const router = Router();

router.get("/jobs", authenticate, requireAdmin, [browseJobs]);
router.post("/jobs/:id/run", authenticate, requireAdmin, [runJob]);

export default router;
