import { Router } from "express";
import readSwipeList from "../controllers/readSwipeList";
import addSwipeList from "../controllers/addSwipeList";
import editSwipeList from "../controllers/editSwipeList";
import endSwipeList from "../controllers/endSwipeList";

const router = Router();

router.get("/read/:id", [readSwipeList]);

router.put("/edit/:id", [editSwipeList]);

router.post("/end/:id", [endSwipeList]);

router.post("/start", [addSwipeList]);

export default router;
