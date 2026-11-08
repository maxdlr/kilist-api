import { Router } from "express";
import browseEmailPreviews from "../controllers/browseEmailPreviews";
import readEmailPreview from "../controllers/readEmailPreview";

const router = Router();

router.get("/preview", [browseEmailPreviews]);
router.get("/preview/:id", [readEmailPreview]);

export default router;
