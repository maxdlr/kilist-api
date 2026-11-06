import authenticate from "@/middlewares/authenticate";
import { Router } from "express";
import {
  answerRaceFood,
  readMe,
  readRace,
  readShop,
  readStandings,
  readVotes,
} from "../controllers";

const router = Router();

router.get("/race", authenticate, [readRace]);
router.post("/race/:id/answer", authenticate, [answerRaceFood]);
router.get("/standings", authenticate, [readStandings]);
router.get("/me", authenticate, [readMe]);
router.get("/shop", authenticate, [readShop]);
router.get("/votes", authenticate, [readVotes]);

export default router;
