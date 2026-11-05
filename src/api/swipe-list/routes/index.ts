import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import readSwipeList from "../controllers/readSwipeList";
import completeSwipeList from "../controllers/completeSwipeList";
import addSwipeList from "../controllers/addSwipeList";
import editSwipeList from "../controllers/editSwipeList";
import endSwipeList from "../controllers/endSwipeList";
import readSwipeGame from "../controllers/readSwipeGame";

const router = Router();

router.get("/game", authenticate, [readSwipeGame]);

router.get("/read/:id", authenticate, [readSwipeList]);

router.put("/edit/:id", authenticate, [editSwipeList]);

router.post("/end/:id", authenticate, [endSwipeList]);

router.post("/start", authenticate, [addSwipeList]);
router.post("/complete", authenticate, [completeSwipeList]);

export default router;
