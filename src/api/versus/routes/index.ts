import authenticate from "@/middlewares/authenticate";
import { Router } from "express";
import answerRaceFood from "../controllers/answerRaceFood";
import readMe from "../controllers/readMe";
import readRace from "../controllers/readRace";
import readShop from "../controllers/readShop";
import readStandings from "../controllers/readStandings";
import readVotes from "../controllers/readVotes";

const router = Router();

router.get("/race", authenticate, [readRace]);
router.post("/race/:id/answer", authenticate, [answerRaceFood]);
router.get("/standings", authenticate, [readStandings]);
router.get("/me", authenticate, [readMe]);
router.get("/shop", authenticate, [readShop]);
router.get("/votes", authenticate, [readVotes]);

export default router;
