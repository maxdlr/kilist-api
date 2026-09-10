import { Router } from "express";
import userRoutes from "./api/users/routes/index";
import listsRoutes from "./api/lists/routes/index";
import foodsRoutes from "./api/foods/routes/index";
import foodHistoriesRoutes from "./api/foodHistories/routes/index";
import getMe from "./api/auth/controllers/getMe";
import logIn from "./api/auth/controllers/logIn";
import authenticate from "./middlewares/authenticate";
import getRefreshToken from "./api/auth/controllers/getRefreshToken";
import logOut from "./api/auth/controllers/logOut";
import signUp from "./api/auth/controllers/signup";
import getHealth from "./api/health/getHeath";

const router = Router();

router.get("/health", getHealth);

router.post("/login", logIn);
router.post("/signup", signUp);
router.post("/logout", authenticate, logOut);
router.post("/refresh", getRefreshToken);

router.get("/me", authenticate, getMe);

router.use("/users", userRoutes);

router.use("/lists", listsRoutes);

router.use("/foods", foodsRoutes);

router.use("/food-histories", foodHistoriesRoutes);

export default router;
