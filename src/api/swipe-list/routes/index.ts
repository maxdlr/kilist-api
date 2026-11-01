import { Router } from "express";
import authenticate from "@/middlewares/authenticate";
import readSwipeList from "../controllers/readSwipeList";
import addSwipeList from "../controllers/addSwipeList";
import editSwipeList from "../controllers/editSwipeList";
import endSwipeList from "../controllers/endSwipeList";

const router = Router();

router.get("/read/:id", authenticate, [readSwipeList]);

router.put("/edit/:id", authenticate, [editSwipeList]);

router.post("/end/:id", authenticate, [endSwipeList]);

router.post("/start", authenticate, [addSwipeList]);

export default router;
