import { Router } from "express";
import addUser from "../controllers/addUser";
import editUser from "../controllers/editUser";
import deleteUser from "../controllers/deleteUser";
import browseUser from "../controllers/browseUser";
import readUser from "../controllers/readUser";
import authenticate from "@/middlewares/authenticate";

const router = Router();

router.post("/add", [addUser]);
router.get("/browse", [browseUser]);
router.get("/read", [readUser]);
router.delete("/delete", authenticate, [deleteUser]);
router.put("/edit", authenticate, [editUser]);

export default router;
