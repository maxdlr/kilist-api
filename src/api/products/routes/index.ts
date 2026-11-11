import { Router } from "express";
import readProduct from "../controllers/readProduct";

const router = Router();

router.get("/:barcode", [readProduct]);

export default router;
