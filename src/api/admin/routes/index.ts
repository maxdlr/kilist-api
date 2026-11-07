import authenticate from "@/middlewares/authenticate";
import requireAdmin from "@/middlewares/requireAdmin";
import { Router } from "express";
import browseJobs from "../controllers/browseJobs";
import * as foods from "../controllers/foods";
import * as households from "../controllers/households";
import * as lists from "../controllers/lists";
import runJob from "../controllers/runJob";
import { browseActions, readStats } from "../controllers/stats";
import * as users from "../controllers/users";

const router = Router();
const admin = [authenticate, requireAdmin];

router.get("/jobs", ...admin, [browseJobs]);
router.post("/jobs/:id/run", ...admin, [runJob]);

router.get("/stats", ...admin, [readStats]);
router.get("/actions", ...admin, [browseActions]);

router.get("/users", ...admin, [users.browseUsers]);
router.post("/users", ...admin, [users.addUser]);
router.get("/users/:id", ...admin, [users.readUser]);
router.put("/users/:id", ...admin, [users.editUser]);
router.put("/users/:id/admin", ...admin, [users.setAdmin]);
router.post("/users/:id/unlocks", ...admin, [users.unlockSkin]);
router.put("/users/:id/skin", ...admin, [users.setSkin]);
router.delete("/users/:id/unlocks/:prizeId", ...admin, [users.removeUnlock]);
router.post("/users/:id/points", ...admin, [users.adjustPoints]);
router.put("/users/:id/household", ...admin, [users.moveUser]);
router.post("/users/:id/logout", ...admin, [users.logOutUser]);
router.delete("/users/:id", ...admin, [users.deleteUser]);

router.get("/households", ...admin, [households.browseHouseholds]);
router.post("/households", ...admin, [households.addHousehold]);
router.get("/households/:id", ...admin, [households.readHousehold]);
router.put("/households/:id", ...admin, [households.renameHousehold]);
router.post("/households/:id/join-code", ...admin, [households.newJoinCode]);
router.post("/households/:id/members", ...admin, [households.addMember]);
router.delete("/households/:id/members/:userId", ...admin, [households.removeMember]);
router.delete("/households/:id", ...admin, [households.deleteHousehold]);

router.get("/foods", ...admin, [foods.browseFoods]);
router.post("/foods", ...admin, [foods.addFood]);
router.post("/foods/match-icons", ...admin, [foods.matchIcons]);
router.get("/foods/:id", ...admin, [foods.readFood]);
router.put("/foods/:id", ...admin, [foods.editFood]);
router.post("/foods/:id/reset-score", ...admin, [foods.resetFoodScore]);
router.post("/foods/:id/unsnooze", ...admin, [foods.unsnoozeFood]);
router.delete("/foods/:id", ...admin, [foods.deleteFood]);

router.get("/lists", ...admin, [lists.browseLists]);
router.post("/lists", ...admin, [lists.addList]);
router.get("/lists/:id", ...admin, [lists.readList]);
router.put("/lists/:id", ...admin, [lists.editList]);
router.post("/lists/:id/foods", ...admin, [lists.addListFoods]);
router.delete("/lists/:id/foods/:foodId", ...admin, [lists.removeListFood]);
router.delete("/lists/:id", ...admin, [lists.deleteList]);

export default router;
