import { Router } from "express";
import readCatalog from "../controllers/readCatalog";

const router = Router();

router.get("/", [readCatalog]);

export default router;
