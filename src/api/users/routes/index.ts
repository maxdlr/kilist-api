import { Router } from "express";
import addUser from "../controllers/addUser";
import editUser from "../controllers/editUser";
import deleteUser from "../controllers/deleteUser";
import browseUser from "../controllers/browseUser";
import readUser from "../controllers/readUser";
import authenticate from "@/middlewares/authenticate";
import requireAdmin from "@/middlewares/requireAdmin";

const router = Router();

router.post("/add", [addUser]);
router.get("/browse", authenticate, requireAdmin, [browseUser]);
router.get("/read", authenticate, requireAdmin, [readUser]);
router.delete("/delete", authenticate, [deleteUser]);
router.put("/edit", authenticate, [editUser]);

export default router;
